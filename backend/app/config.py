import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="allow"
    )

    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    redis_url: str
    dify_api_key: str
    dify_api_url: str
    dify_frontend_url: str = "http://localhost:3001"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
