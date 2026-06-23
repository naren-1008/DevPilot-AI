from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    tech_stack: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    status: Optional[str] = None
    current_agent: Optional[str] = None
    logs: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    status: str
    current_agent: Optional[str] = None
    logs: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
