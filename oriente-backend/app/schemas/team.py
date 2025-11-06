from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# === ENUMS ===

class TeamStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


# === BASE SCHEMAS ===

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Nome da equipe")
    description: Optional[str] = Field(None, max_length=500, description="Descrição da equipe")
    status: TeamStatusEnum = Field(TeamStatusEnum.ACTIVE, description="Status da equipe")


# === REQUEST SCHEMAS ===

class TeamCreateRequest(TeamBase):
    leader_id: int = Field(..., description="ID do líder da equipe")
    member_ids: Optional[List[int]] = Field([], description="IDs dos membros da equipe (líder será adicionado automaticamente)")


class TeamUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Novo nome da equipe")
    description: Optional[str] = Field(None, max_length=500, description="Nova descrição da equipe")
    leader_id: Optional[int] = Field(None, description="Novo líder da equipe")
    status: Optional[TeamStatusEnum] = Field(None, description="Novo status da equipe")


class TeamMemberRequest(BaseModel):
    user_ids: List[int] = Field(..., min_items=1, description="IDs dos usuários a serem adicionados/removidos")


# === RESPONSE SCHEMAS ===

class TeamMemberResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str  # Campo role do User (ADMIN/USER)

    class Config:
        from_attributes = True


class TeamLeaderResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class TeamResponse(TeamBase):
    id: int
    leader_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    # Dados relacionais
    leader: Optional[TeamLeaderResponse] = None
    members: List[TeamMemberResponse] = []
    projects_count: int = 0

    class Config:
        from_attributes = True


class TeamListResponse(BaseModel):
    teams: List[TeamResponse]
    total: int


class TeamSummaryResponse(BaseModel):
    id: int
    name: str
    status: TeamStatusEnum
    leader_name: Optional[str] = None
    members_count: int = 0
    projects_count: int = 0

    class Config:
        from_attributes = True


# === DETAILED RESPONSES ===

class ProjectSummary(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TeamDetailedResponse(TeamResponse):
    projects: List[ProjectSummary] = []

    class Config:
        from_attributes = True


# === UTILITY SCHEMAS ===

class TeamStatsResponse(BaseModel):
    team_id: int
    team_name: str
    total_members: int
    total_projects: int
    active_projects: int
    completed_tasks: int
    pending_tasks: int

    class Config:
        from_attributes = True


class AddMembersResponse(BaseModel):
    message: str
    added_members: List[TeamMemberResponse]
    already_members: List[str] = []  # Emails dos usuários que já eram membros
    not_found: List[str] = []  # Emails não encontrados


class RemoveMembersResponse(BaseModel):
    message: str
    removed_members: List[TeamMemberResponse]
    not_members: List[str] = []  # Emails que não eram membros
    not_found: List[str] = []  # Emails não encontrados