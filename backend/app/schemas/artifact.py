from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime

class ArtifactBase(BaseModel):
    agent_type: str
    title: str

class ArtifactCreate(ArtifactBase):
    content_json: str

class ArtifactResponse(BaseModel):
    id: int
    project_id: int
    agent_type: str
    title: str
    content: Any  # Decoded content_json object
    created_at: datetime

    class Config:
        from_attributes = True
