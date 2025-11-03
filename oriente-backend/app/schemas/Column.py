from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# === BASE SCHEMAS ===

class ColumnBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="Titulo da Coluna")
    description: Optional[str] = Field(None, max_length=500, description="Descrição da coluna")
    color: Optional[str] = Field("#6366f1", pattern="^#[0-9A-Fa-f]{6}$", description="Cor em hexadecimal")


# === REQUEST SCHEMAS ===

class ColumnCreate(ColumnBase):
    position: Optional[int] = Field(0, ge=0, description="Posição da coluna (0 = primeira)")


class ColumnUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class ColumnMove(BaseModel):
    new_position: int = Field(..., ge=0, description="Nova posição da coluna")


# === RESPONSE SCHEMAS ===

class ColumnResponse(ColumnBase):
    id: int
    position: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ColumnListResponse(BaseModel):
    columns: List[ColumnResponse]
    total: int


# === BULK OPERATIONS ===

class ColumnReorder(BaseModel):
    column_id: int
    new_position: int


class ColumnsBulkReorder(BaseModel):
    reorders: List[ColumnReorder] = Field(..., min_items=1, description="Lista de reordenações")
