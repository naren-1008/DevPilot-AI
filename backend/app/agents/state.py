from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    project_id: int
    project_name: str
    project_description: str
    tech_stack_preference: Optional[str]
    
    # Cumulative outputs of each agent
    requirements: Optional[Dict[str, Any]]
    architecture: Optional[Dict[str, Any]]
    frontend: Optional[Dict[str, Any]]
    backend: Optional[Dict[str, Any]]
    qa: Optional[Dict[str, Any]]
    documentation: Optional[Dict[str, Any]]
    
    # Progress and status monitoring
    current_agent: str
    logs: List[str]
    errors: List[str]
