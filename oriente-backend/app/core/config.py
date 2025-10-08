from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Configurações da aplicação
    """
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/oriente"

    # JWT
    JWT_SECRET: str = "oriente-super-secret-development-key-that-is-long-enough-for-hs256-algorithm-to-work-properly-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 horas (86400000ms / 60000)

    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8080

    # CORS
    CORS_ORIGINS: list = ["*"]

    # App
    APP_NAME: str = "Oriente Backend"
    APP_VERSION: str = "0.0.1"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
