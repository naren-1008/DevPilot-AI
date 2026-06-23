import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Explicitly load .env from the backend directory relative to this config file
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = BASE_DIR / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv()

# Map GEMINI_API_KEY to GOOGLE_API_KEY for LangChain packages if needed
if "GEMINI_API_KEY" in os.environ and not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]


class Settings(BaseSettings):
    PROJECT_NAME: str = "DevPilot AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "devpilot_super_secret_key_change_me_in_production_12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # DB URL default to sqlite if postgres is not provided
    DATABASE_URL: str = "sqlite:///./devpilot.db"
    
    # Vector DB settings
    CHROMA_DB_DIR: str = "./data/chroma_db"
    
    # Gemini API settings
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"  # Default model
    
    model_config = SettingsConfigDict(
        env_file=str(dotenv_path) if dotenv_path.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
