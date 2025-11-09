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
    team_id: int = Field(..., description="ID da equipe associada ao projeto")
    member_names: Optional[List[str]] = Field(default=[], description="Lista de nomes dos membros")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Projeto X",
                "description": "Descrição do projeto X",
                "team_id": 1,
                "member_names": ["João Silva", "Maria Santos"]
            }
        }


class ProjectUpdateRequest(BaseModel):
    """
    Schema para atualização de projetos existentes
    Equivalente a: ProjectUpdateRequest.java
    """
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Nome do projeto")
    description: Optional[str] = Field(None, max_length=500, description="Descrição do projeto")
    member_names: Optional[List[str]] = Field(None, description="Lista de nomes dos membros")
    new_owner_name: Optional[str] = Field(None, description="Nome do novo responsável/líder do projeto")

    def has_updates(self) -> bool:
        """Verifica se há alguma informação a ser atualizada"""
        return self.name is not None or self.description is not None or self.member_names is not None or self.new_owner_name is not None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Projeto X Atualizado",
                "description": "Nova descrição",
                "member_names": ["João Silva"],
                "new_owner_name": "Maria Santos"
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
    member_names: List[str]
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
