from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# === RESPONSE SCHEMAS ===

class ChatMessageAttachmentUploader(BaseModel):
    """Informações básicas do usuário que fez o upload"""
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class ChatMessageAttachmentResponse(BaseModel):
    """Schema de resposta com todos os campos do anexo de mensagem de chat"""
    id: int
    filename: str
    file_path: str
    file_size: int
    mime_type: str
    message_id: int
    uploaded_by_id: Optional[int] = None
    created_at: datetime

    # Informações do usuário que fez o upload (nested)
    uploaded_by: Optional[ChatMessageAttachmentUploader] = None

    class Config:
        from_attributes = True


class ChatMessageAttachmentListResponse(BaseModel):
    """Schema de resposta para lista de anexos de mensagem de chat"""
    attachments: list[ChatMessageAttachmentResponse]
    total: int

    class Config:
        from_attributes = True
