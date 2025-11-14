from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)  # Nome original do arquivo
    file_path = Column(String(500), nullable=False)  # Caminho no servidor
    file_size = Column(BigInteger, nullable=False)  # Tamanho em bytes
    mime_type = Column(String(100), nullable=False)  # Tipo MIME do arquivo

    # Foreign Keys
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    card = relationship("Card", back_populates="attachments")
    uploaded_by = relationship("User")

    def __repr__(self):
        return f"<Attachment(id={self.id}, filename='{self.filename}', card_id={self.card_id})>"
