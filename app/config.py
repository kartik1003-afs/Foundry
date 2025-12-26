import os
from pydantic import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Application
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    
    # Google Cloud Vision
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    
    # Embedding Model
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    
    # File Uploads
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", 16))
    ALLOWED_EXTENSIONS: set = {"png", "jpg", "jpeg", "gif"}
    
    # FAISS
    FAISS_INDEX_PATH: str = os.getenv("FAISS_INDEX_PATH", "data/faiss_index")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create upload and data directories
os.makedirs(os.getenv("UPLOAD_FOLDER", "uploads"), exist_ok=True)
os.makedirs(os.getenv("FAISS_INDEX_PATH", "data/faiss_index"), exist_ok=True)

settings = Settings()
