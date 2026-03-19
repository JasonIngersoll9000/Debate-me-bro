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
    persona_model: str = "claude-haiku-4-5"
    max_debates_per_user: int = 5
    admin_emails: str = ""
    
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    @property
    def admin_email_set(self) -> set[str]:
        """Parse comma-separated admin emails into a set."""
        if not self.admin_emails:
            return set()
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}

settings = Settings()
