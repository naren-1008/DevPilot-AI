from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Artifact(Base):
    __tablename__ = "artifacts"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    agent_type = Column(String, nullable=False)  # requirement, architect, frontend, backend, qa, doc
    title = Column(String, nullable=False)
    content_json = Column(Text, nullable=False)  # JSON formatted artifact data
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="artifacts")
