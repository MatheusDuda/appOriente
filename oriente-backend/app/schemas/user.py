from pydantic import BaseModel, EmailStr, Field, field_validator
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


class UserUpdateRequest(BaseModel):
    """
    Schema para atualização de dados do usuário
    Equivalente a: UserUpdateRequest.java
    """
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Nome do usuário")
    email: Optional[EmailStr] = Field(None, description="Email do usuário")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "João Silva Santos",
                "email": "joao.santos@example.com"
            }
        }


class UserResponse(BaseModel):
    """
    Schema completo para resposta de dados do usuário
    Equivalente a: UserResponse.java
    """
    id: int
    name: str
    email: str
    role: str
    status: UserStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "name": "João Silva",
                "email": "joao@example.com",
                "role": "USER",
                "status": "ACTIVE",
                "created_at": "2024-01-15T10:30:00",
                "updated_at": "2024-01-20T14:45:00"
            }
        }


class UserListResponse(BaseModel):
    """
    Schema para listagem paginada de usuários
    Equivalente a: UserListResponse.java
    """
    users: list[UserResponse]
    total: int
    page: int
    size: int
    total_pages: int

    class Config:
        json_schema_extra = {
            "example": {
                "users": [
                    {
                        "id": 1,
                        "name": "João Silva",
                        "email": "joao@example.com",
                        "role": "USER",
                        "status": "ACTIVE",
                        "created_at": "2024-01-15T10:30:00",
                        "updated_at": "2024-01-20T14:45:00"
                    }
                ],
                "total": 50,
                "page": 1,
                "size": 10,
                "total_pages": 5
            }
        }


class PasswordChangeRequest(BaseModel):
    """
    Schema para mudança de senha
    Equivalente a: PasswordChangeRequest.java
    """
    old_password: str = Field(..., description="Senha atual")
    new_password: str = Field(..., min_length=6, max_length=50, description="Nova senha")

    class Config:
        json_schema_extra = {
            "example": {
                "old_password": "senhaAntiga123",
                "new_password": "novaSenha456"
            }
        }


class ApiResponse(BaseModel):
    """
    Schema genérico para respostas da API
    Equivalente a: ApiResponse.java
    """
    success: bool
    message: str
    data: Optional[dict | list | UserDto | LoginResponse | UserResponse | UserListResponse] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operação realizada com sucesso",
                "data": {}
            }
        }

class UserRoleUpdateRequest(BaseModel):
    """Request para atualizar role do usuario"""
    role: str = Field(
        ...,
        description="Nova role do usuario",
        pattern="^(ADMIN|USER)$"
    )

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ['ADMIN', 'USER']:
            raise ValueError('Role inexistente')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "role": "ADMIN"
            }
        }
