from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.models.chat import ChatType


# === BASE SCHEMAS ===

class ChatBase(BaseModel):
    """Schema base para Chat"""
    name: Optional[str] = Field(None, min_length=2, max_length=200, description="Nome do chat (obrigatório para grupos)")


class ChatMessageBase(BaseModel):
    """Schema base para Mensagem de Chat"""
    content: str = Field(..., min_length=1, description="Conteúdo da mensagem")


# === REQUEST SCHEMAS ===

class ChatCreate(BaseModel):
    """Schema para criação de chat"""
    type: ChatType = Field(..., description="Tipo do chat (individual ou group)")
    name: Optional[str] = Field(None, min_length=2, max_length=200, description="Nome do chat (obrigatório para grupos)")
    participant_ids: List[int] = Field(..., min_items=1, description="IDs dos participantes (mínimo 1)")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "individual",
                "participant_ids": [2]
            }
        }


class ChatUpdate(BaseModel):
    """Schema para atualização de chat (apenas nome de grupos)"""
    name: str = Field(..., min_length=2, max_length=200, description="Novo nome do grupo")


class ChatMessageCreate(ChatMessageBase):
    """Schema para criação de mensagem"""
    pass


class ChatMessageUpdate(BaseModel):
    """Schema para atualização de mensagem"""
    content: str = Field(..., min_length=1, description="Novo conteúdo da mensagem")


class AddParticipantRequest(BaseModel):
    """Schema para adicionar participante a um grupo"""
    user_id: int = Field(..., description="ID do usuário a ser adicionado")


class UpdateLastReadRequest(BaseModel):
    """Schema para atualizar última leitura"""
    last_message_id: Optional[int] = Field(None, description="ID da última mensagem lida (opcional)")


# === RESPONSE SCHEMAS ===

class ChatParticipantResponse(BaseModel):
    """Informações de um participante do chat"""
    id: int
    name: str
    email: str
    joined_at: Optional[datetime] = None
    last_read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatMessageSender(BaseModel):
    """Informações básicas do remetente da mensagem"""
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class ChatMessageResponse(ChatMessageBase):
    """Schema de resposta para mensagem de chat"""
    id: int
    chat_id: int
    sender_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_edited: bool = False
    edited_at: Optional[datetime] = None

    # Remetente (nested)
    sender: Optional[ChatMessageSender] = None

    # Anexos (nested)
    attachments: List[Any] = []

    # Permissões calculadas
    can_edit: bool = False
    can_delete: bool = False

    class Config:
        from_attributes = True


class ChatLastMessage(BaseModel):
    """Preview da última mensagem do chat"""
    id: int
    content: str
    sender_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(ChatBase):
    """Schema de resposta para chat (listagem)"""
    id: int
    type: ChatType
    created_at: datetime
    updated_at: datetime

    # Nome formatado para o usuário
    display_name: str

    # Participantes (lista resumida)
    participant_count: int = 0
    participants: List[ChatParticipantResponse] = []

    # Última mensagem (preview)
    last_message: Optional[ChatLastMessage] = None

    # Mensagens não lidas
    unread_count: int = 0

    class Config:
        from_attributes = True


class ChatDetailResponse(ChatResponse):
    """Schema de resposta detalhada para chat (visualização individual)"""
    # Herda tudo de ChatResponse, pode adicionar campos extras se necessário
    pass


class ChatMessageListResponse(BaseModel):
    """Schema de resposta para lista paginada de mensagens"""
    total: int
    messages: List[ChatMessageResponse]
    has_more: bool = False

    class Config:
        from_attributes = True


# === WEBSOCKET SCHEMAS ===

class WebSocketMessage(BaseModel):
    """Schema para mensagens WebSocket"""
    type: str = Field(..., description="Tipo do evento: 'message', 'typing', 'read', 'error'")
    data: dict = Field(..., description="Dados do evento")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "message",
                "data": {
                    "content": "Olá!"
                }
            }
        }
