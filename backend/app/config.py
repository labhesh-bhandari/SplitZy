from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = "changeme"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "splitzy"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
