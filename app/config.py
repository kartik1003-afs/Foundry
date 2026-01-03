# import os
# from pydantic_settings import BaseSettings
# from typing import List, Optional
# from functools import lru_cache

# class Settings(BaseSettings):
#     # Application settings
#     APP_NAME: str = "Lost & Found AI"
#     DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
#     ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
#     SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
#     API_PREFIX: str = os.getenv("API_PREFIX", "/api/v1")
    
#     # CORS settings
#     CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    
#     # Google Cloud Vision
#     GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
#     # FAISS Index
#     FAISS_INDEX_PATH: str = os.getenv("FAISS_INDEX_PATH", "./data/faiss_index")
#     EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))  # all-MiniLM-L6-v2 dimension
    
#     # File upload settings
#     MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB
#     ALLOWED_IMAGE_TYPES: List[str] = os.getenv(
#         "ALLOWED_IMAGE_TYPES", 
#         "image/jpeg,image/png,image/webp"
#     ).split(",")
    
#     # Rate limiting
#     RATE_LIMIT: int = int(os.getenv("RATE_LIMIT", "100"))  # requests per minute

#     class Config:
#         env_file = ".env"
#         case_sensitive = True

# @lru_cache()
# def get_settings() -> Settings:
#     return Settings()

# settings = get_settings()

TOP_K = 5

IMAGE_WEIGHT = 0.6
TEXT_WEIGHT = 0.4

SCORE_THRESHOLD = 0.3
