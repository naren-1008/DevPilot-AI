import os
import json
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.agents.state import AgentState

def get_llm():
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    kwargs = {
        "model": settings.GEMINI_MODEL,
        "temperature": 0.2,
        "convert_system_message_to_human": True
    }
    if api_key:
        kwargs["google_api_key"] = api_key
    return ChatGoogleGenerativeAI(**kwargs)

def clean_json_response(content: str) -> dict:
    # Remove markdown code fences if present
    cleaned = content.strip()
    if cleaned.startswith("```"):
        # Match ```json ... ``` or ``` ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Emergency parsing or fallback structure if JSON parsing fails
        print(f"JSON parsing failed. Attempting to parse manually. Content sample: {cleaned[:200]}")
        return {
            "functional_requirements": "Failed to parse functional requirements in JSON.",
            "non_functional_requirements": "Failed to parse non-functional requirements in JSON.",
            "user_stories": "Failed to parse user stories.",
            "srs": cleaned
        }

def analyst_node(state: AgentState) -> AgentState:
    project_name = state["project_name"]
    project_description = state["project_description"]
    tech_stack = state.get("tech_stack_preference") or "Not specified"
    
    log_msg = "Requirement Analyst Agent: Generating requirements, user stories, and SRS..."
    state["logs"].append(log_msg)
    print(log_msg)
    
    system_prompt = (
        "You are an expert Requirement Analyst Agent. Your job is to analyze the user's project idea "
        "and generate functional requirements, non-functional requirements, user stories, and a detailed "
        "Software Requirement Specification (SRS).\n\n"
        "You must respond ONLY with a raw JSON object containing exactly these four keys:\n"
        "1. \"functional_requirements\": (string) A comprehensive list of functional requirements in Markdown format.\n"
        "2. \"non_functional_requirements\": (string) A list of non-functional requirements in Markdown format (performance, security, scalability, etc.).\n"
        "3. \"user_stories\": (string) A set of user stories with acceptance criteria in Markdown format.\n"
        "4. \"srs\": (string) A full, production-ready Software Requirement Specification (SRS) document in Markdown format.\n\n"
        "Do not include any chat prefix/suffix or normal conversational text. Output only valid JSON."
    )
    
    user_prompt = (
        f"Project Name: {project_name}\n"
        f"Description: {project_description}\n"
        f"Tech Stack Preference: {tech_stack}\n"
    )
    
    try:
        llm = get_llm()
        response = llm.invoke([
            ("system", system_prompt),
            ("user", user_prompt)
        ])
        
        parsed_result = clean_json_response(response.content)
        state["requirements"] = parsed_result
        state["logs"].append("Requirement Analyst Agent: Completed successfully.")
    except Exception as e:
        error_msg = f"Requirement Analyst Agent error: {str(e)}"
        state["errors"].append(error_msg)
        state["logs"].append(error_msg)
        state["requirements"] = {
            "functional_requirements": "Failed to generate functional requirements due to an error.",
            "non_functional_requirements": "Failed to generate non-functional requirements due to an error.",
            "user_stories": "Failed to generate user stories due to an error.",
            "srs": f"Error: {str(e)}"
        }
        
    return state
