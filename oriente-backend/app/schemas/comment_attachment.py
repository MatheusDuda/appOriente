from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# === RESPONSE SCHEMAS ===

class CommentAttachmentUploader(BaseModel):
    """Informações básicas do usuário que fez o upload"""
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class CommentAttachmentResponse(BaseModel):
    """Schema de resposta com todos os campos do anexo de comentário"""
    id: int
    filename: str
    file_path: str
    file_size: int
    mime_type: str
    comment_id: int
    uploaded_by_id: Optional[int] = None
    created_at: datetime

    # Informações do usuário que fez o upload (nested)
    uploaded_by: Optional[CommentAttachmentUploader] = None

    class Config:
        from_attributes = True


class CommentAttachmentListResponse(BaseModel):
    """Schema de resposta para lista de anexos de comentário"""
    attachments: list[CommentAttachmentResponse]
    total: int

    class Config:
        from_attributes = True
