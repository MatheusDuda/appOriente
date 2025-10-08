from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class ProjectCreateRequest(BaseModel):
    """
    Schema para criação de novos projetos
    Equivalente a: ProjectCreateRequest.java

    NOTA: O owner (dono) do projeto será automaticamente definido como o usuário autenticado
    que está fazendo a requisição. Não é necessário especificar no request.
    """
    name: str = Field(..., min_length=2, max_length=100, description="Nome do projeto")
    description: str = Field(..., max_length=500, description="Descrição do projeto")
    member_emails: Optional[List[EmailStr]] = Field(default=[], description="Lista de emails dos membros")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Projeto X",
                "description": "Descrição do projeto X",
                "member_emails": ["membro1@example.com", "membro2@example.com"]
            }
        }


class ProjectUpdateRequest(BaseModel):
    """
    Schema para atualização de projetos existentes
    Equivalente a: ProjectUpdateRequest.java
    """
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Nome do projeto")
    description: Optional[str] = Field(None, max_length=500, description="Descrição do projeto")
    member_emails: Optional[List[EmailStr]] = Field(None, description="Lista de emails dos membros")

    def has_updates(self) -> bool:
        """Verifica se há alguma informação a ser atualizada"""
        return self.name is not None or self.description is not None or self.member_emails is not None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Projeto X Atualizado",
                "description": "Nova descrição",
                "member_emails": ["membro1@example.com"]
            }
        }


class ProjectResponse(BaseModel):
    """
    Schema para resposta de projetos
    Equivalente a: ProjectResponse.java
    """
    id: int
    name: str
    description: Optional[str]
    owner_email: str
    member_emails: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectSummary(BaseModel):
    """
    Schema para resumo de projetos (usado em listagens)
    Equivalente a: ProjectSummary.java
    """
    id: int
    name: str
    description: Optional[str]
    owner_email: str
    member_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
