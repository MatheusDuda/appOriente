from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class CardPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class CardStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"

# Tabela para associação para many-to-many entre Cards e Users
card_assignees = Table(
    "card_assignees",
    Base.metadata,
    Column("card_id", Integer, ForeignKey("cards.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)

# Tabela de associação para many-to-many entre Cards e Tags
card_tags = Table(
    "card_tags",
    Base.metadata,
    Column("card_id", Integer, ForeignKey("cards.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    position = Column(Integer, nullable=False, default=0)
    priority = Column(Enum(CardPriority), nullable=False, default=CardPriority.MEDIUM)
    status = Column(Enum(CardStatus), nullable=False, default=CardStatus.ACTIVE)

    # Dates
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Foreign Keys
    column_id = Column(Integer, ForeignKey("kanban_columns.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    column = relationship("KanbanColumn", back_populates="cards")
    project = relationship("Project", back_populates="cards")
    created_by = relationship("User", foreign_keys=[created_by_id])
    assignees = relationship("User", secondary=card_assignees, back_populates="assigned_cards")
    tags = relationship("Tag", secondary=card_tags, back_populates="cards")
    comments = relationship("Comment", back_populates="card", cascade="all, delete-orphan")
    history = relationship("CardHistory", back_populates="card", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Card(id={self.id}, title='{self.title}', column_id={self.column_id})>"

    class Config:
        from_attributes = True


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    color = Column(String(7), nullable=False, default="#6366f1")  # Hex color

    # Foreign Keys
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="tags")
    cards = relationship("Card", secondary=card_tags, back_populates="tags")

    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}', project_id={self.project_id})>"

    class Config:
        from_attributes = True