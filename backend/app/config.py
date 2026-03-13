from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives at the repo root (one level above backend/)
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/debatemebro"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "insecure_default_secret_please_change"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    debate_mode: str = "demo"
    debate_model: str = "claude-sonnet-4-20250514"
    persona_model: str = "claude-haiku-4-20250414"
    
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8", extra="ignore")

settings = Settings()
