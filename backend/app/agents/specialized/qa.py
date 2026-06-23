import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.agents.state import AgentState
from app.agents.specialized.analyst import get_llm, clean_json_response

def qa_node(state: AgentState) -> AgentState:
    project_name = state["project_name"]
    project_description = state["project_description"]
    requirements = state.get("requirements") or {}
    architecture = state.get("architecture") or {}
    backend = state.get("backend") or {}
    
    srs = requirements.get("srs") or ""
    api_endpoints = architecture.get("api_endpoints") or ""
    db_models = backend.get("database_models") or ""
    
    log_msg = "QA Engineer Agent: Generating unit and integration tests, edge cases, and API test scenarios..."
    state["logs"].append(log_msg)
    print(log_msg)
    
    system_prompt = (
        "You are an expert QA Engineer Agent. Your job is to define the testing strategy "
        "and test cases (unit, integration, edge cases, and API scenarios) based on the "
        "SRS, API specifications, and code skeletons.\n\n"
        "You must respond ONLY with a raw JSON object containing exactly these four keys:\n"
        "1. \"unit_test_cases\": (string) A comprehensive set of unit tests in Python (pytest) or Javascript (Jest) in Markdown format or raw code block.\n"
        "2. \"integration_test_cases\": (string) Markdown list outlining integration test flows, checking multi-component behaviors.\n"
        "3. \"edge_cases\": (string) Markdown list of negative scenarios, high load behaviors, token expirations, data validations, and race conditions.\n"
        "4. \"api_test_scenarios\": (string) Markdown list or table detailing API routes, valid/invalid inputs, header tokens, and expected status codes (e.g. 200, 400, 401, 404, 422).\n\n"
        "Do not include any chat prefix/suffix or normal conversational text. Output only valid JSON."
    )
    
    user_prompt = (
        f"Project Name: {project_name}\n"
        f"Description: {project_description}\n"
        f"SRS:\n{srs[:2000]}\n"
        f"API Endpoints:\n{api_endpoints[:1000]}\n"
        f"DB Models:\n{db_models[:1000]}\n"
    )
    
    try:
        llm = get_llm()
        response = llm.invoke([
            ("system", system_prompt),
            ("user", user_prompt)
        ])
        
        parsed_result = clean_json_response(response.content)
        state["qa"] = parsed_result
        state["logs"].append("QA Engineer Agent: Completed successfully.")
    except Exception as e:
        error_msg = f"QA Engineer Agent error: {str(e)}"
        state["errors"].append(error_msg)
        state["logs"].append(error_msg)
        state["qa"] = {
            "unit_test_cases": "# Failed to generate unit test cases.",
            "integration_test_cases": "Failed to generate integration test cases.",
            "edge_cases": "Failed to generate edge cases.",
            "api_test_scenarios": "Failed to generate API test scenarios."
        }
        
    return state
