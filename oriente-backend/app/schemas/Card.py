from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Union
from datetime import datetime, date
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

    @field_validator('description', mode='before')
    @classmethod
    def empty_str_to_none_description(cls, v):
        if v == "" or v is None:
            return None
        return v

    @field_validator('due_date', mode='before')
    @classmethod
    def parse_due_date(cls, v):
        if v == "" or v is None:
            return None
        # Se já é datetime, retornar como está
        if isinstance(v, datetime):
            return v
        # Se é date, converter para datetime
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        # Se é string no formato YYYY-MM-DD, converter para datetime
        if isinstance(v, str):
            try:
                # Tentar parsear como data (YYYY-MM-DD)
                parsed_date = datetime.strptime(v, "%Y-%m-%d")
                return parsed_date
            except ValueError:
                # Se falhar, deixar o Pydantic tentar parsear
                pass
        return v


# === REQUEST SCHEMAS ===

class CardCreate(CardBase):
    column_id: int = Field(..., description="ID da coluna onde criar a tarefa")
    position: Optional[int] = Field(None, ge=0, description="Posição na coluna (None = última)")
    assignee_ids: Optional[List[int]] = Field(default=None, description="IDs dos usuários atribuídos")

    @field_validator('assignee_ids', mode='before')
    @classmethod
    def empty_list_to_none(cls, v):
        if v == [] or v is None:
            return None
        return v


class CardUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None)
    priority: Optional[CardPriorityEnum] = Field(None)
    due_date: Optional[datetime] = Field(None)
    assignee_ids: Optional[List[int]] = Field(None)


class CardMove(BaseModel):
    column_id: int = Field(..., description="ID da coluna de destino")
    new_position: int = Field(..., ge=0, description="Nova posição na coluna")


class CardStatusUpdate(BaseModel):
    status: CardStatusEnum = Field(..., description="Novo status da tarefa")


# === RESPONSE SCHEMAS ===

class UserBasic(BaseModel):
    id: int
    name: str
    email: str

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
    column_id: Optional[int] = Field(None, description="Filtrar por coluna")
    due_soon: Optional[bool] = Field(None, description="Tarefas com vencimento próximo")