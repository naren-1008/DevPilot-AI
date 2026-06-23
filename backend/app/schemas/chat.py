from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatMessageBase(BaseModel):
    message: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    project_id: int
    sender: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatQuery(BaseModel):
    query: str

class ChatAnswer(BaseModel):
    answer: str
    context: Optional[str] = None
