from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# === ENUMS ===

class CardPriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class CardStatusEnum(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


# === BASE SCHEMAS ===

class CardBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Título da tarefa")
    description: Optional[str] = Field(None, description="Descrição detalhada da tarefa")
    priority: CardPriorityEnum = Field(CardPriorityEnum.MEDIUM, description="Prioridade da tarefa")
    due_date: Optional[datetime] = Field(None, description="Data de vencimento")


# === REQUEST SCHEMAS ===

class CardCreate(CardBase):
    column_id: int = Field(..., description="ID da coluna onde criar a tarefa")
    position: Optional[int] = Field(None, ge=0, description="Posição na coluna (None = última)")
    assignee_ids: Optional[List[int]] = Field([], description="IDs dos usuários atribuídos")
    tag_ids: Optional[List[int]] = Field([], description="IDs das tags")


class CardUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None)
    priority: Optional[CardPriorityEnum] = Field(None)
    due_date: Optional[datetime] = Field(None)
    assignee_ids: Optional[List[int]] = Field(None)
    tag_ids: Optional[List[int]] = Field(None)


class CardMove(BaseModel):
    column_id: int = Field(..., description="ID da coluna de destino")
    new_position: int = Field(..., ge=0, description="Nova posição na coluna")


class CardStatusUpdate(BaseModel):
    status: CardStatusEnum = Field(..., description="Novo status da tarefa")


# === RESPONSE SCHEMAS ===

class UserBasic(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True


class TagResponse(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True


class CardResponse(CardBase):
    id: int
    position: int
    status: CardStatusEnum
    column_id: int
    project_id: int
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    # Relationships
    created_by: Optional[UserBasic]
    assignees: List[UserBasic] = []
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True


class CardListResponse(BaseModel):
    cards: List[CardResponse]
    total: int


class CardWithColumn(CardResponse):
    column: "ColumnBasic"

    class Config:
        from_attributes = True


# === UTILITY SCHEMAS ===

class ColumnBasic(BaseModel):
    id: int
    title: str
    color: str

    class Config:
        from_attributes = True


# === BULK OPERATIONS ===

class CardReorder(BaseModel):
    card_id: int
    column_id: int
    new_position: int


class CardsBulkMove(BaseModel):
    moves: List[CardReorder] = Field(..., min_items=1, description="Lista de movimentações")


# === FILTERS ===

class CardFilters(BaseModel):
    status: Optional[CardStatusEnum] = Field(None, description="Filtrar por status")
    priority: Optional[CardPriorityEnum] = Field(None, description="Filtrar por prioridade")
    assignee_id: Optional[int] = Field(None, description="Filtrar por usuário atribuído")
    tag_id: Optional[int] = Field(None, description="Filtrar por tag")
    column_id: Optional[int] = Field(None, description="Filtrar por coluna")
    due_soon: Optional[bool] = Field(None, description="Tarefas com vencimento próximo")


# === TAG SCHEMAS ===

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Nome da tag")
    color: str = Field("#6366f1", pattern="^#[0-9A-Fa-f]{6}$", description="Cor em hexadecimal")


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")