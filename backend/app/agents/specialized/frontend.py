import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.agents.state import AgentState
from app.agents.specialized.analyst import get_llm, clean_json_response

def frontend_node(state: AgentState) -> AgentState:
    project_name = state["project_name"]
    project_description = state["project_description"]
    requirements = state.get("requirements") or {}
    architecture = state.get("architecture") or {}
    
    srs = requirements.get("srs") or ""
    api_endpoints = architecture.get("api_endpoints") or ""
    
    log_msg = "Frontend Developer Agent: Generating page list, component hierarchy, React skeletons, and validations..."
    state["logs"].append(log_msg)
    print(log_msg)
    
    system_prompt = (
        "You are an expert Frontend Developer Agent. Your job is to define the user interface "
        "architecture for the project using Next.js, React, Tailwind CSS, and TypeScript.\n\n"
        "You must respond ONLY with a raw JSON object containing exactly these four keys:\n"
        "1. \"page_list\": (string) A Markdown list of all pages in the app, their routes, and brief description.\n"
        "2. \"component_hierarchy\": (string) A Markdown component hierarchy list detailing reusable UI and layout elements.\n"
        "3. \"react_component_skeletons\": (object) A JSON dictionary mapping relative file paths (e.g., \"components/Button.tsx\", \"app/dashboard/page.tsx\") to their complete React/TypeScript code skeletons utilizing Tailwind CSS.\n"
        "4. \"form_validation_suggestions\": (string) Markdown list outlining forms in the application, validation fields (email, password, requirements), and recommended regex/rules.\n\n"
        "Do not include any chat prefix/suffix or normal conversational text. Output only valid JSON."
    )
    
    user_prompt = (
        f"Project Name: {project_name}\n"
        f"Description: {project_description}\n"
        f"SRS:\n{srs[:2000]}\n"
        f"API Endpoints:\n{api_endpoints[:2000]}\n"
    )
    
    try:
        llm = get_llm()
        response = llm.invoke([
            ("system", system_prompt),
            ("user", user_prompt)
        ])
        
        parsed_result = clean_json_response(response.content)
        
        # Verify react_component_skeletons exists and is a dictionary
        if "react_component_skeletons" not in parsed_result:
            parsed_result["react_component_skeletons"] = {}
        elif not isinstance(parsed_result["react_component_skeletons"], dict):
            # If model returned stringified json, attempt to parse it
            try:
                parsed_result["react_component_skeletons"] = json.loads(parsed_result["react_component_skeletons"])
            except Exception:
                parsed_result["react_component_skeletons"] = {"components/App.tsx": str(parsed_result["react_component_skeletons"])}
                
        state["frontend"] = parsed_result
        state["logs"].append("Frontend Developer Agent: Completed successfully.")
    except Exception as e:
        error_msg = f"Frontend Developer Agent error: {str(e)}"
        state["errors"].append(error_msg)
        state["logs"].append(error_msg)
        state["frontend"] = {
            "page_list": "Failed to generate page list.",
            "component_hierarchy": "Failed to generate component hierarchy.",
            "react_component_skeletons": {},
            "form_validation_suggestions": "Failed to generate form validation suggestions."
        }
        
    return state
