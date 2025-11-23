from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ChatMessage(Base):
    """
    Modelo de Mensagem de Chat
    Representa uma mensagem enviada em um chat
    """
    __tablename__ = "chat_messages"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Conteúdo da mensagem
    content = Column(Text, nullable=False)

    # Foreign Keys
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Controle de edição
    is_edited = Column(Boolean, default=False, nullable=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamentos
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", back_populates="chat_messages")
    attachments = relationship("ChatMessageAttachment", back_populates="message", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, chat_id={self.chat_id}, sender_id={self.sender_id})>"

    class Config:
        from_attributes = True
