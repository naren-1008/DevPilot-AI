import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.agents.state import AgentState
from app.agents.specialized.analyst import get_llm, clean_json_response

def doc_node(state: AgentState) -> AgentState:
    project_name = state["project_name"]
    project_description = state["project_description"]
    requirements = state.get("requirements") or {}
    architecture = state.get("architecture") or {}
    backend = state.get("backend") or {}
    qa = state.get("qa") or {}
    
    srs = requirements.get("srs") or ""
    tech_stack = architecture.get("recommended_tech_stack") or ""
    api_endpoints = architecture.get("api_endpoints") or ""
    
    log_msg = "Documentation Agent: Compiling README, installation guides, API docs, and deployment steps..."
    state["logs"].append(log_msg)
    print(log_msg)
    
    system_prompt = (
        "You are an expert Technical Documentation Agent. Your job is to compile the user guide, "
        "installation instructions, API documents, and deployment instructions for the project "
        "based on the generated artifacts from earlier agents.\n\n"
        "You must respond ONLY with a raw JSON object containing exactly these four keys:\n"
        "1. \"readme\": (string) A comprehensive README.md file in Markdown format detailing the project name, description, features, and folder tree.\n"
        "2. \"installation_guide\": (string) A step-by-step setup guide for development (packages, venv, DB migrations) in Markdown format.\n"
        "3. \"api_documentation\": (string) API reference docs detailing methods, headers, schemas, and examples in Markdown format.\n"
        "4. \"deployment_instructions\": (string) Detailed cloud deployment guide (Docker, AWS, Heroku, or Vercel/Render) in Markdown format.\n\n"
        "Do not include any chat prefix/suffix or normal conversational text. Output only valid JSON."
    )
    
    user_prompt = (
        f"Project Name: {project_name}\n"
        f"Description: {project_description}\n"
        f"Recommended Tech Stack:\n{tech_stack[:1000]}\n"
        f"API Endpoints:\n{api_endpoints[:1000]}\n"
    )
    
    try:
        llm = get_llm()
        response = llm.invoke([
            ("system", system_prompt),
            ("user", user_prompt)
        ])
        
        parsed_result = clean_json_response(response.content)
        state["documentation"] = parsed_result
        state["logs"].append("Documentation Agent: Completed successfully.")
    except Exception as e:
        error_msg = f"Documentation Agent error: {str(e)}"
        state["errors"].append(error_msg)
        state["logs"].append(error_msg)
        state["documentation"] = {
            "readme": "# Failed to generate README.",
            "installation_guide": "Failed to generate installation guide.",
            "api_documentation": "Failed to generate API documentation.",
            "deployment_instructions": "Failed to generate deployment instructions."
        }
        
    return state
