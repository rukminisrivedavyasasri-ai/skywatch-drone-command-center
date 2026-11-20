import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "SkyWatch Command Center"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "skywatch_super_secret_jwt_key_2026_ciphercop")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./skywatch.db")
    
    # Geospatial Default: Hyderabad City Center (Command HQ)
    HQ_LATITUDE: float = 17.385044
    HQ_LONGITUDE: float = 78.486671
    
    # Fleet Simulator config
    SIMULATOR_INTERVAL_SECONDS: float = 1.0
    
    # Uploads & Storage
    STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sample_data")
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["*"]

settings = Settings()
