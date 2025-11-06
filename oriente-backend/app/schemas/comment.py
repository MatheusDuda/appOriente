from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# === BASE SCHEMAS ===

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, description="Conteúdo do comentário (suporta Markdown básico)")


# === REQUEST SCHEMAS ===

class CommentCreate(CommentBase):
    """Schema para criação de comentário"""
    pass


class CommentUpdate(CommentBase):
    """Schema para atualização de comentário"""
    pass


# === RESPONSE SCHEMAS ===

class CommentAuthor(BaseModel):
    """Informações básicas do autor do comentário"""
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class CommentResponse(CommentBase):
    """Schema de resposta com todos os campos do comentário"""
    id: int
    card_id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Informações do autor (nested)
    user: Optional[CommentAuthor] = None

    # Permissões calculadas (adicionadas pelo service)
    can_edit: bool = False
    can_delete: bool = False

    class Config:
        from_attributes = True
