from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# === RESPONSE SCHEMAS ===

class AttachmentUploader(BaseModel):
    """Informações básicas do usuário que fez o upload"""
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    """Schema de resposta com todos os campos do anexo"""
    id: int
    filename: str
    file_path: str
    file_size: int
    mime_type: str
    card_id: int
    uploaded_by_id: Optional[int] = None
    created_at: datetime

    # Informações do usuário que fez o upload (nested)
    uploaded_by: Optional[AttachmentUploader] = None

    class Config:
        from_attributes = True


class AttachmentListResponse(BaseModel):
    """Schema de resposta para lista de anexos"""
    attachments: list[AttachmentResponse]
    total: int

    class Config:
        from_attributes = True
