from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class NotificationType(str, enum.Enum):
    """
    Tipos de notificação
    """
    TASK = "TASK"           # Notificações relacionadas a tarefas
    TEAM = "TEAM"           # Notificações relacionadas a equipes
    SYSTEM = "SYSTEM"       # Notificações do sistema


class RelatedEntityType(str, enum.Enum):
    """
    Tipos de entidades relacionadas à notificação
    """
    TASK = "TASK"           # Relacionado a uma tarefa
    PROJECT = "PROJECT"     # Relacionado a um projeto
    TEAM = "TEAM"           # Relacionado a uma equipe


class Notification(Base):
    """
    Modelo de notificação
    Notificações enviadas aos usuários sobre eventos do sistema
    """
    __tablename__ = "notifications"

    # Chave primária
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Tipo e conteúdo
    type = Column(SQLEnum(NotificationType), default=NotificationType.SYSTEM, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    # Status da notificação
    is_read = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Destinatário (Foreign Key)
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Entidade relacionada (opcional)
    related_entity_type = Column(SQLEnum(RelatedEntityType), nullable=True)
    related_entity_id = Column(Integer, nullable=True)

    # URL de ação (opcional) - para redirecionar o usuário ao clicar
    action_url = Column(String(500), nullable=True)

    # Relacionamentos
    recipient = relationship("User", foreign_keys=[recipient_user_id])

    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.type}', recipient_id={self.recipient_user_id}, is_read={self.is_read})>"
