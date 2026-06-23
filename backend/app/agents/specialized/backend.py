import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.agents.state import AgentState
from app.agents.specialized.analyst import get_llm, clean_json_response

def backend_node(state: AgentState) -> AgentState:
    project_name = state["project_name"]
    project_description = state["project_description"]
    requirements = state.get("requirements") or {}
    architecture = state.get("architecture") or {}
    
    srs = requirements.get("srs") or ""
    db_schema = architecture.get("database_schema") or ""
    api_endpoints = architecture.get("api_endpoints") or ""
    
    log_msg = "Backend Developer Agent: Generating FastAPI route skeletons, database models, auth flow, and API specs..."
    state["logs"].append(log_msg)
    print(log_msg)
    
    system_prompt = (
        "You are an expert Backend Developer Agent. Your job is to define the backend "
        "architecture and code skeletons using FastAPI, Pydantic, and SQLAlchemy.\n\n"
        "You must respond ONLY with a raw JSON object containing exactly these four keys:\n"
        "1. \"fastapi_route_skeletons\": (object) A JSON dictionary mapping relative file paths (e.g., \"app/main.py\", \"app/routes/auth.py\") to their complete FastAPI python route code skeletons.\n"
        "2. \"database_models\": (string) Complete Python code (using SQLAlchemy or SQLModel) representing the database tables, relational fields, and configuration.\n"
        "3. \"authentication_flow\": (string) A Markdown description of the authentication process, password hashing, token validation, and security context.\n"
        "4. \"api_specifications\": (string) A detailed API specification (in OpenAPI JSON format or Markdown format) outlining requests, responses, status codes, and error codes.\n\n"
        "Do not include any chat prefix/suffix or normal conversational text. Output only valid JSON."
    )
    
    user_prompt = (
        f"Project Name: {project_name}\n"
        f"Description: {project_description}\n"
        f"SRS:\n{srs[:2000]}\n"
        f"Database Schema:\n{db_schema[:2000]}\n"
        f"API Endpoints:\n{api_endpoints[:2000]}\n"
    )
    
    try:
        llm = get_llm()
        response = llm.invoke([
            ("system", system_prompt),
            ("user", user_prompt)
        ])
        
        parsed_result = clean_json_response(response.content)
        
        # Verify fastapi_route_skeletons exists and is a dictionary
        if "fastapi_route_skeletons" not in parsed_result:
            parsed_result["fastapi_route_skeletons"] = {}
        elif not isinstance(parsed_result["fastapi_route_skeletons"], dict):
            try:
                parsed_result["fastapi_route_skeletons"] = json.loads(parsed_result["fastapi_route_skeletons"])
            except Exception:
                parsed_result["fastapi_route_skeletons"] = {"app/main.py": str(parsed_result["fastapi_route_skeletons"])}
                
        state["backend"] = parsed_result
        state["logs"].append("Backend Developer Agent: Completed successfully.")
    except Exception as e:
        error_msg = f"Backend Developer Agent error: {str(e)}"
        state["errors"].append(error_msg)
        state["logs"].append(error_msg)
        state["backend"] = {
            "fastapi_route_skeletons": {},
            "database_models": "# Failed to generate database models.",
            "authentication_flow": "Failed to generate authentication flow description.",
            "api_specifications": "Failed to generate API specifications."
        }
        
    return state
