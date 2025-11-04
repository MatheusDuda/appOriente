from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

# Tabela de associação para Many-to-Many (Project <-> User members)
project_members = Table(
    'project_members',
    Base.metadata,
    Column('project_id', Integer, ForeignKey('projects.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True)
)


class Project(Base):
    """
    Modelo de projeto
    Equivalente a: com.oriente.oriente_backend.entity.Project
    """
    __tablename__ = "projects"

    # Chave primária
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Campos básicos
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)

    # Owner (ManyToOne)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamentos
    # Owner: Um projeto tem um dono
    owner = relationship("User", back_populates="owned_projects", foreign_keys=[owner_id])

    # Members: Um projeto tem vários membros (Many-to-Many)
    members = relationship(
        "User",
        secondary=project_members,
        back_populates="member_projects"
    )

    # Columns: Um projeto tem várias colunas do kanban
    columns = relationship("KanbanColumn", back_populates="project", cascade="all, delete-orphan")

    # Cards: Um projeto tem vários cards
    cards = relationship("Card", back_populates="project", cascade="all, delete-orphan")

    # Tags: Um projeto tem várias tags
    tags = relationship("Tag", back_populates="project", cascade="all, delete-orphan")

    def update_timestamp(self):
        """Atualiza o timestamp manualmente"""
        self.updated_at = datetime.utcnow()

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', owner_id={self.owner_id})>"
