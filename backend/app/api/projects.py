import io
import json
import zipfile
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import google.generativeai as genai

from app.database import get_db
from app.config import settings
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.artifact import Artifact
from app.models.chat import ChatMessage
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.schemas.artifact import ArtifactResponse
from app.schemas.chat import ChatQuery, ChatAnswer, ChatMessageResponse
from app.agents.graph import agent_orchestrator
from app.services.vector_store import vector_store

router = APIRouter()

# Background task runner for LangGraph
def run_agent_pipeline(project_id: int, project_name: str, project_description: str, tech_stack_preference: str):
    try:
        # Initialize state
        initial_state = {
            "project_id": project_id,
            "project_name": project_name,
            "project_description": project_description,
            "tech_stack_preference": tech_stack_preference,
            "requirements": {},
            "architecture": {},
            "frontend": {},
            "backend": {},
            "qa": {},
            "documentation": {},
            "current_agent": "Initializing",
            "logs": ["Starting autonomous multi-agent pipeline...", f"Project: {project_name}"],
            "errors": []
        }
        
        # Invoke LangGraph orchestrator
        agent_orchestrator.invoke(initial_state)
    except Exception as e:
        print(f"Orchestrator pipeline crash: {e}")
        # Mark as failed in DB
        db = SessionLocal()
        try:
            proj = db.query(Project).filter(Project.id == project_id).first()
            if proj:
                proj.status = "failed"
                proj.logs += f"\nOrchestrator pipeline crash error: {str(e)}"
                db.commit()
        except Exception as db_err:
            print(f"Failed to record pipeline crash: {db_err}")
        finally:
            db.close()

# SQLite session helper since background task needs its own database session
from app.database import SessionLocal

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(
        owner_id=current_user.id,
        name=project_in.name,
        description=project_in.description,
        tech_stack=project_in.tech_stack,
        status="pending",
        logs="Project created. Awaiting generation run."
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Project).filter(Project.owner_id == current_user.id).order_by(Project.created_at.desc()).all()

@router.get("/{id}", response_model=ProjectResponse)
def get_project(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/{id}/generate")
def generate_project(id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.status == "running":
        raise HTTPException(status_code=400, detail="Pipeline is already executing")
        
    project.status = "running"
    project.current_agent = "Requirement Analyst"
    project.logs = "Starting pipeline...\nRequirement Analyst Agent triggered..."
    db.commit()
    
    # Run in FastAPI background thread
    background_tasks.add_task(
        run_agent_pipeline,
        project_id=project.id,
        project_name=project.name,
        project_description=project.description,
        tech_stack_preference=project.tech_stack
    )
    
    return {"message": "Agent execution pipeline started in the background", "status": "running"}

@router.get("/{id}/artifacts", response_model=List[ArtifactResponse])
def get_artifacts(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_artifacts = db.query(Artifact).filter(Artifact.project_id == id).all()
    
    # Parse json strings back to dict objects for schemas
    response = []
    for art in db_artifacts:
        try:
            content = json.loads(art.content_json)
        except Exception:
            content = art.content_json
        response.append(
            ArtifactResponse(
                id=art.id,
                project_id=art.project_id,
                agent_type=art.agent_type,
                title=art.title,
                content=content,
                created_at=art.created_at
            )
        )
    return response

@router.get("/{id}/chat", response_model=List[ChatMessageResponse])
def get_chat_history(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(ChatMessage).filter(ChatMessage.project_id == id).order_by(ChatMessage.created_at.asc()).all()

@router.post("/{id}/chat", response_model=ChatAnswer)
def ask_project_assistant(id: int, query_in: ChatQuery, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Query our custom vector store
    results = vector_store.query_project_artifacts(project_id=id, query_text=query_in.query, n_results=3)
    
    context = ""
    for r in results:
        context += f"\n\nSource: {r['metadata']['title']}\nContent:\n{r['content']}"
        
    if not context:
        context = "No generated agent specifications found. Please generate the project specifications first."

    # Ask Gemini API
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        answer = "Gemini API Key is missing. Cannot run RAG chat assistant. Please set GEMINI_API_KEY."
    else:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            
            system_prompt = (
                "You are DevPilot AI, an autonomous software development assistant. "
                "Your job is to answer questions about the generated codebase specifications, "
                "designs, schemas, skeletons, and requirements using the provided context.\n\n"
                "Use the following context snippets from the generated project specifications to answer "
                "the user's question. If the information is not in the context, say that you cannot find it. "
                "Keep your response helpful, technical, and concise.\n\n"
                f"Context:\n{context}"
            )
            
            response = model.generate_content(
                contents=[
                    {"role": "user", "parts": [f"{system_prompt}\n\nUser Question: {query_in.query}"]}
                ]
            )
            answer = response.text
        except Exception as e:
            answer = f"Error generating answer: {str(e)}"
            
    # Save user query and agent response to DB
    user_msg = ChatMessage(project_id=id, sender="user", message=query_in.query)
    assistant_msg = ChatMessage(project_id=id, sender="assistant", message=answer)
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()
    
    return ChatAnswer(answer=answer, context=context)

@router.get("/{id}/export")
def export_project_zip(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    artifacts = db.query(Artifact).filter(Artifact.project_id == id).all()
    
    # Write to zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # Create folders and files
        for art in artifacts:
            try:
                data = json.loads(art.content_json)
            except Exception:
                continue
                
            agent_type = art.agent_type
            
            if agent_type == "requirement":
                zip_file.writestr("docs/functional_requirements.md", data.get("functional_requirements", ""))
                zip_file.writestr("docs/non_functional_requirements.md", data.get("non_functional_requirements", ""))
                zip_file.writestr("docs/user_stories.md", data.get("user_stories", ""))
                zip_file.writestr("docs/SRS.md", data.get("srs", ""))
                
            elif agent_type == "architect":
                zip_file.writestr("docs/recommended_tech_stack.md", data.get("recommended_tech_stack", ""))
                zip_file.writestr("docs/high_level_architecture.md", data.get("high_level_architecture", ""))
                zip_file.writestr("docs/database_schema.md", data.get("database_schema", ""))
                zip_file.writestr("docs/folder_structure.md", data.get("folder_structure", ""))
                zip_file.writestr("docs/api_endpoints.md", data.get("api_endpoints", ""))
                zip_file.writestr("docs/uml_diagrams.md", data.get("uml_diagrams", ""))
                
            elif agent_type == "frontend":
                zip_file.writestr("docs/frontend_pages.md", data.get("page_list", ""))
                zip_file.writestr("docs/frontend_hierarchy.md", data.get("component_hierarchy", ""))
                zip_file.writestr("docs/frontend_validations.md", data.get("form_validation_suggestions", ""))
                
                skeletons = data.get("react_component_skeletons", {})
                for path, code in skeletons.items():
                    # Sanitize path
                    clean_path = path.lstrip("/\\")
                    zip_file.writestr(f"frontend/{clean_path}", code)
                    
            elif agent_type == "backend":
                zip_file.writestr("docs/backend_database_models.py", data.get("database_models", ""))
                zip_file.writestr("docs/backend_auth_flow.md", data.get("authentication_flow", ""))
                zip_file.writestr("docs/backend_api_specs.md", data.get("api_specifications", ""))
                
                skeletons = data.get("fastapi_route_skeletons", {})
                for path, code in skeletons.items():
                    clean_path = path.lstrip("/\\")
                    zip_file.writestr(f"backend/{clean_path}", code)
                    
            elif agent_type == "qa":
                zip_file.writestr("docs/qa_unit_tests.py", data.get("unit_test_cases", ""))
                zip_file.writestr("docs/qa_integration_tests.md", data.get("integration_test_cases", ""))
                zip_file.writestr("docs/qa_edge_cases.md", data.get("edge_cases", ""))
                zip_file.writestr("docs/qa_api_scenarios.md", data.get("api_test_scenarios", ""))
                
            elif agent_type == "doc":
                zip_file.writestr("README.md", data.get("readme", ""))
                zip_file.writestr("docs/installation_guide.md", data.get("installation_guide", ""))
                zip_file.writestr("docs/api_documentation.md", data.get("api_documentation", ""))
                zip_file.writestr("docs/deployment_instructions.md", data.get("deployment_instructions", ""))
                
        # If no README was generated, write a basic one
        if "README.md" not in zip_file.namelist():
            zip_file.writestr("README.md", f"# {project.name}\n\nGenerated by DevPilot AI.\n\nDescription: {project.description}\n")

    zip_buffer.seek(0)
    filename = f"{project.name.lower().replace(' ', '_')}_devpilot.zip"
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
