from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# === ENUMS ===

class NotificationTypeEnum(str, Enum):
    """Tipos de notificação"""
    TASK = "TASK"
    TEAM = "TEAM"
    SYSTEM = "SYSTEM"


class RelatedEntityTypeEnum(str, Enum):
    """Tipos de entidades relacionadas"""
    TASK = "TASK"
    PROJECT = "PROJECT"
    TEAM = "TEAM"


# === REQUEST SCHEMAS ===

class NotificationCreateRequest(BaseModel):
    """
    Schema para criação de notificação
    ADMIN pode especificar recipient_user_id para enviar a outros usuários
    Usuários normais criam notificações apenas para si mesmos (recipient será o próprio usuário)
    """
    type: NotificationTypeEnum = Field(..., description="Tipo da notificação")
    title: str = Field(..., min_length=1, max_length=255, description="Título da notificação")
    message: str = Field(..., min_length=1, description="Mensagem da notificação")
    recipient_user_id: Optional[int] = Field(None, description="ID do destinatário (apenas ADMIN pode especificar)")
    related_entity_type: Optional[RelatedEntityTypeEnum] = Field(None, description="Tipo da entidade relacionada")
    related_entity_id: Optional[int] = Field(None, description="ID da entidade relacionada")
    action_url: Optional[str] = Field(None, max_length=500, description="URL de ação ao clicar na notificação")


class NotificationMarkReadRequest(BaseModel):
    """Schema para marcar notificação(ões) como lida(s)"""
    notification_ids: List[int] = Field(..., min_items=1, description="IDs das notificações a serem marcadas como lidas")


# === RESPONSE SCHEMAS ===

class NotificationRecipientResponse(BaseModel):
    """Schema simplificado do destinatário"""
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    """Schema de resposta de notificação"""
    id: int
    type: NotificationTypeEnum
    title: str
    message: str
    is_read: bool
    created_at: datetime
    recipient_user_id: int
    related_entity_type: Optional[RelatedEntityTypeEnum] = None
    related_entity_id: Optional[int] = None
    action_url: Optional[str] = None

    # Dados relacionais (opcional)
    recipient: Optional[NotificationRecipientResponse] = None

    class Config:
        from_attributes = True


class NotificationSummaryResponse(BaseModel):
    """Schema simplificado de notificação para listagens"""
    id: int
    type: NotificationTypeEnum
    title: str
    message: str
    is_read: bool
    created_at: datetime
    action_url: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Schema de resposta para lista de notificações"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


# === UTILITY SCHEMAS ===

class NotificationStatsResponse(BaseModel):
    """Schema para estatísticas de notificações"""
    total: int = Field(..., description="Total de notificações")
    unread_count: int = Field(..., description="Total de notificações não lidas")
    read_count: int = Field(..., description="Total de notificações lidas")
    by_type: dict = Field(
        default_factory=dict,
        description="Contagem por tipo de notificação"
    )
    # Exemplo: {"TASK": 10, "TEAM": 5, "SYSTEM": 2}


class NotificationMarkReadResponse(BaseModel):
    """Schema de resposta ao marcar notificações como lidas"""
    message: str
    marked_count: int = Field(..., description="Quantidade de notificações marcadas como lidas")
    notification_ids: List[int] = Field(..., description="IDs das notificações marcadas")
