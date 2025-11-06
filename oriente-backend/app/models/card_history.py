from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class CardHistoryAction(str, enum.Enum):
    """
    Tipos de ações que podem ser registradas no histórico do card
    """
    CREATED = "CREATED"                    # Card criado
    UPDATED = "UPDATED"                    # Dados do card alterados
    MOVED = "MOVED"                        # Card movido entre colunas
    COMMENT_ADDED = "COMMENT_ADDED"        # Comentário adicionado
    COMMENT_DELETED = "COMMENT_DELETED"    # Comentário removido
    ASSIGNEE_ADDED = "ASSIGNEE_ADDED"      # Usuário atribuído
    ASSIGNEE_REMOVED = "ASSIGNEE_REMOVED"  # Usuário removido
    TAG_ADDED = "TAG_ADDED"                # Tag adicionada
    TAG_REMOVED = "TAG_REMOVED"            # Tag removida


class CardHistory(Base):
    """
    Modelo de histórico de alterações dos cards
    Registra todas as mudanças importantes que acontecem em um card
    """
    __tablename__ = "card_histories"

    # Chave primária
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Tipo de ação realizada
    action = Column(SQLEnum(CardHistoryAction), nullable=False)

    # Relacionamentos (Foreign Keys)
    card_id = Column(Integer, ForeignKey('cards.id', ondelete='CASCADE'), nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)  # Quem fez a ação

    # Dados da ação
    message = Column(String(500), nullable=False)  # Mensagem legível em português
    details = Column(JSON, nullable=True)          # Detalhes adicionais em JSON

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relacionamentos
    card = relationship("Card", back_populates="history")
    project = relationship("Project")
    user = relationship("User")  # Usuário que realizou a ação

    def __repr__(self):
        return f"<CardHistory(id={self.id}, action='{self.action}', card_id={self.card_id}, user_id={self.user_id})>"

    class Config:
        from_attributes = True