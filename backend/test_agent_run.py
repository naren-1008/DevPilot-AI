import sys
import os
import json

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.project import Project
from app.agents.graph import agent_orchestrator

def main():
    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 2. Get or create test user
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            user = User(email="test@example.com", hashed_password="fakehashpassword", full_name="Test User")
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created test user: {user.email}")
        else:
            print(f"Found test user: {user.email}")
            
        # 3. Create a test project
        project = Project(
            owner_id=user.id,
            name="Food Delivery App",
            description="A modern mobile app for ordering food from nearby restaurants with real-time tracking.",
            tech_stack="React Native, FastAPI, PostgreSQL",
            status="pending",
            logs="Initializing test run..."
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        print(f"Created test project: {project.name} (ID: {project.id})")
        
        # 4. Run orchestrator
        initial_state = {
            "project_id": project.id,
            "project_name": project.name,
            "project_description": project.description,
            "tech_stack_preference": project.tech_stack,
            "requirements": {},
            "architecture": {},
            "frontend": {},
            "backend": {},
            "qa": {},
            "documentation": {},
            "current_agent": "Initializing",
            "logs": ["Starting autonomous multi-agent pipeline...", f"Project: {project.name}"],
            "errors": []
        }
        
        print("Invoking agent orchestrator...")
        # Update project status to running in DB
        project.status = "running"
        project.logs = "Starting pipeline..."
        db.commit()
        
        # Run graph
        final_state = agent_orchestrator.invoke(initial_state)
        
        # Refresh project from DB
        db.refresh(project)
        print("\n=== EXECUTION LOGS ===")
        print(project.logs)
        print("=======================")
        print(f"\nProject final status: {project.status}")
        print(f"Project current agent: {project.current_agent}")
        print(f"Errors list: {final_state.get('errors', [])}")
        
    except Exception as e:
        print(f"Execution failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
