import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.agents.state import AgentState
from app.agents.specialized.analyst import get_llm, clean_json_response

def architect_node(state: AgentState) -> AgentState:
    project_name = state["project_name"]
    project_description = state["project_description"]
    requirements = state.get("requirements") or {}
    srs = requirements.get("srs") or ""
    
    log_msg = "Software Architect Agent: Designing tech stack, architecture, folder structure, API, and UML diagrams..."
    state["logs"].append(log_msg)
    print(log_msg)
    
    system_prompt = (
        "You are an expert Software Architect Agent. Your job is to read the requirements and SRS, "
        "and produce a professional, detailed software architecture document including a recommended tech stack, "
        "high-level architecture, database schema, folder structure, API endpoints, and a UML class or system diagram "
        "using Mermaid syntax.\n\n"
        "You must respond ONLY with a raw JSON object containing exactly these six keys:\n"
        "1. \"recommended_tech_stack\": (string) Recommended languages, frameworks, databases, libraries in Markdown.\n"
        "2. \"high_level_architecture\": (string) High-level architectural patterns (e.g., MVC, Microservices, Layered) in Markdown.\n"
        "3. \"database_schema\": (string) ER diagram description, SQL table structures, indexes, and primary/foreign keys in Markdown.\n"
        "4. \"folder_structure\": (string) A visual tree structure of the suggested directory setup in Markdown code block (using text lines like `src/`, `components/`, etc.).\n"
        "5. \"api_endpoints\": (string) A Markdown table of API endpoints with columns: Method, Route, Description, Request Body, Response.\n"
        "6. \"uml_diagrams\": (string) A valid Mermaid syntax diagram (e.g., classDiagram, sequenceDiagram, erDiagram, or flowchart TD) representing the architecture or database. ONLY return the mermaid code itself, without markdown fences around it inside the JSON value.\n\n"
        "Do not include any chat prefix/suffix or normal conversational text. Output only valid JSON."
    )
    
    user_prompt = (
        f"Project Name: {project_name}\n"
        f"Description: {project_description}\n"
        f"SRS / Requirements:\n{srs[:4000]}\n"
    )
    
    try:
        llm = get_llm()
        response = llm.invoke([
            ("system", system_prompt),
            ("user", user_prompt)
        ])
        
        parsed_result = clean_json_response(response.content)
        state["architecture"] = parsed_result
        state["logs"].append("Software Architect Agent: Completed successfully.")
    except Exception as e:
        error_msg = f"Software Architect Agent error: {str(e)}"
        state["errors"].append(error_msg)
        state["logs"].append(error_msg)
        state["architecture"] = {
            "recommended_tech_stack": "Failed to generate recommended tech stack.",
            "high_level_architecture": "Failed to generate architecture.",
            "database_schema": "Failed to generate database schema.",
            "folder_structure": "Failed to generate folder structure.",
            "api_endpoints": "Failed to generate API endpoints.",
            "uml_diagrams": "graph TD\n    A[Error] --> B[Failed to generate diagram]"
        }
        
    return state
