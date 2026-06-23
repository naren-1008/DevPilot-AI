import json
from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.specialized.analyst import analyst_node
from app.agents.specialized.architect import architect_node
from app.agents.specialized.frontend import frontend_node
from app.agents.specialized.backend import backend_node
from app.agents.specialized.qa import qa_node
from app.agents.specialized.doc import doc_node
from app.database import SessionLocal
from app.models.project import Project
from app.models.artifact import Artifact
from app.services.vector_store import vector_store

def update_project_db(project_id: int, current_agent: str, logs: list, status: str = "running", artifact_data: dict = None, agent_type: str = None):
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.current_agent = current_agent
            project.logs = "\n".join(logs)
            project.status = status
            
            if artifact_data and agent_type:
                # Convert content to string and store
                content_json = json.dumps(artifact_data, ensure_ascii=False)
                
                # Check if artifact already exists
                art = db.query(Artifact).filter(
                    Artifact.project_id == project_id,
                    Artifact.agent_type == agent_type
                ).first()
                
                if art:
                    art.content_json = content_json
                else:
                    art = Artifact(
                        project_id=project_id,
                        agent_type=agent_type,
                        title=f"{current_agent} Output",
                        content_json=content_json
                    )
                    db.add(art)
                
                # Flatten the artifact dict for search indexing in the vector store
                vector_content = f"--- {current_agent} Output ---\n"
                for k, v in artifact_data.items():
                    if isinstance(v, str):
                        vector_content += f"\n### {k.replace('_', ' ').title()} ###\n{v}\n"
                    elif isinstance(v, dict):
                        vector_content += f"\n### {k.replace('_', ' ').title()} ###\n"
                        for sub_k, sub_v in v.items():
                            vector_content += f"- File: {sub_k}\nCode:\n{sub_v}\n"
                
                # Index in our vector store
                vector_store.add_artifact_document(
                    project_id=project_id,
                    agent_type=agent_type,
                    title=f"{current_agent} Specs",
                    content=vector_content
                )
            
            db.commit()
    except Exception as e:
        print(f"Error updating project db in agent node: {e}")
        db.rollback()
    finally:
        db.close()

# Wrapped nodes to perform updates
def wrapped_analyst_node(state: AgentState) -> AgentState:
    update_project_db(state["project_id"], "Requirement Analyst Agent", state["logs"], "running")
    state = analyst_node(state)
    update_project_db(
        state["project_id"], 
        "Requirement Analyst Agent", 
        state["logs"], 
        "running", 
        artifact_data=state.get("requirements"),
        agent_type="requirement"
    )
    return state

def wrapped_architect_node(state: AgentState) -> AgentState:
    update_project_db(state["project_id"], "Software Architect Agent", state["logs"], "running")
    state = architect_node(state)
    update_project_db(
        state["project_id"], 
        "Software Architect Agent", 
        state["logs"], 
        "running", 
        artifact_data=state.get("architecture"),
        agent_type="architect"
    )
    return state

def wrapped_frontend_node(state: AgentState) -> AgentState:
    update_project_db(state["project_id"], "Frontend Developer Agent", state["logs"], "running")
    state = frontend_node(state)
    update_project_db(
        state["project_id"], 
        "Frontend Developer Agent", 
        state["logs"], 
        "running", 
        artifact_data=state.get("frontend"),
        agent_type="frontend"
    )
    return state

def wrapped_backend_node(state: AgentState) -> AgentState:
    update_project_db(state["project_id"], "Backend Developer Agent", state["logs"], "running")
    state = backend_node(state)
    update_project_db(
        state["project_id"], 
        "Backend Developer Agent", 
        state["logs"], 
        "running", 
        artifact_data=state.get("backend"),
        agent_type="backend"
    )
    return state

def wrapped_qa_node(state: AgentState) -> AgentState:
    update_project_db(state["project_id"], "QA Engineer Agent", state["logs"], "running")
    state = qa_node(state)
    update_project_db(
        state["project_id"], 
        "QA Engineer Agent", 
        state["logs"], 
        "running", 
        artifact_data=state.get("qa"),
        agent_type="qa"
    )
    return state

def wrapped_doc_node(state: AgentState) -> AgentState:
    update_project_db(state["project_id"], "Documentation Agent", state["logs"], "running")
    state = doc_node(state)
    # The final documentation agent sets the status to completed
    update_project_db(
        state["project_id"], 
        "Documentation Agent", 
        state["logs"], 
        "completed", 
        artifact_data=state.get("documentation"),
        agent_type="doc"
    )
    return state

# Compile LangGraph orchestrator
workflow = StateGraph(AgentState)
workflow.add_node("requirements_agent", wrapped_analyst_node)
workflow.add_node("architect_agent", wrapped_architect_node)
workflow.add_node("frontend_agent", wrapped_frontend_node)
workflow.add_node("backend_agent", wrapped_backend_node)
workflow.add_node("qa_agent", wrapped_qa_node)
workflow.add_node("doc_agent", wrapped_doc_node)

workflow.set_entry_point("requirements_agent")
workflow.add_edge("requirements_agent", "architect_agent")
workflow.add_edge("architect_agent", "frontend_agent")
workflow.add_edge("frontend_agent", "backend_agent")
workflow.add_edge("backend_agent", "qa_agent")
workflow.add_edge("qa_agent", "doc_agent")
workflow.add_edge("doc_agent", END)

agent_orchestrator = workflow.compile()

