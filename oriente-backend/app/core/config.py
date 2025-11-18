from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """
    Configurações da aplicação
    Valores padrão para desenvolvimento, sobrescritos por variáveis de ambiente em produção
    """
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/oriente"

    # JWT
    JWT_SECRET: str = "oriente-super-secret-development-key-that-is-long-enough-for-hs256-algorithm-to-work-properly-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 horas

    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8080

    # CORS - Aceita string separada por vírgulas ou lista
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    # App
    APP_NAME: str = "Oriente Backend"
    APP_VERSION: str = "0.0.1"
    DEBUG: bool = True

    # Upload/Attachments
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB em bytes
    ALLOWED_EXTENSIONS: str = "pdf,jpg,jpeg,png,gif,doc,docx,xls,xlsx,txt,zip"
    PROJECT_QUOTA_MB: int = 100  # Quota total de armazenamento por projeto em MB

    # Cloudinary (para uploads em produção)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    @property
    def cors_origins_list(self) -> list:
        """Converte CORS_ORIGINS de string para lista"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

    @property
    def use_cloudinary(self) -> bool:
        """Verifica se Cloudinary está configurado"""
        return all([
            self.CLOUDINARY_CLOUD_NAME,
            self.CLOUDINARY_API_KEY,
            self.CLOUDINARY_API_SECRET
        ])

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
