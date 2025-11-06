from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class CommentAudit(Base):
    """
    Auditoria de deleções de comentários
    Registra quando um ADMIN deleta um comentário de outro usuário
    """
    __tablename__ = "comment_audits"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, nullable=False)  # ID do comentário deletado (não FK porque já foi deletado)
    content = Column(Text, nullable=False)  # Cópia do conteúdo antes da deleção
    original_author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deleted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    original_author = relationship("User", foreign_keys=[original_author_id])
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])

    def __repr__(self):
        return f"<CommentAudit(id={self.id}, comment_id={self.comment_id}, deleted_by_id={self.deleted_by_id})>"
