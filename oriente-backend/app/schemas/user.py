from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserStatus


class RegisterRequest(BaseModel):
    """
    Schema para registro de novos usuários
    Equivalente a: RegisterRequest.java
    """
    name: str = Field(..., min_length=2, max_length=100, description="Nome do usuário")
    email: EmailStr = Field(..., description="Email do usuário")
    password: str = Field(..., min_length=6, max_length=50, description="Senha do usuário")
    role: str = Field(default="USER", description="Role/Papel do usuário")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "João Silva",
                "email": "joao@example.com",
                "password": "senha123",
                "role": "USER"
            }
        }


class LoginRequest(BaseModel):
    """
    Schema para login de usuários
    Equivalente a: LoginRequest.java
    """
    email: EmailStr = Field(..., description="Email do usuário")
    password: str = Field(..., description="Senha do usuário")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "joao@example.com",
                "password": "senha123"
            }
        }


class UserDto(BaseModel):
    """
    Schema para retorno de dados do usuário (sem senha)
    Equivalente a: UserDto.java
    """
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True  # Permite conversão de ORM models


class LoginResponse(BaseModel):
    """
    Schema para resposta de login
    Equivalente a: LoginResponse.java
    """
    token: str
    type: str = "Bearer"
    user: UserDto

    class Config:
        json_schema_extra = {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "type": "Bearer",
                "user": {
                    "id": 1,
                    "name": "João Silva",
                    "email": "joao@example.com",
                    "role": "USER"
                }
            }
        }


class ApiResponse(BaseModel):
    """
    Schema genérico para respostas da API
    Equivalente a: ApiResponse.java
    """
    success: bool
    message: str
    data: Optional[dict | list | UserDto | LoginResponse] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operação realizada com sucesso",
                "data": {}
            }
        }
