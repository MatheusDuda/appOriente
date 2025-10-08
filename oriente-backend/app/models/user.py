from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class UserStatus(str, enum.Enum):
    """
    Status do usuário
    """
    ONLINE = "ONLINE"         # O usuário está logado e ativo
    OFFLINE = "OFFLINE"       # O usuário está deslogado
    SUSPENDED = "SUSPENDED"   # O usuário foi suspenso temporariamente por um administrador
    DEACTIVATED = "DEACTIVATED"  # A conta do usuário foi desativada permanentemente


class User(Base):
    """
    Modelo de usuário
    Equivalente a: com.oriente.oriente_backend.entity.User
    """
    __tablename__ = "users"

    # Chave primária
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Campos básicos
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)  # Hash da senha (BCrypt)

    # Status do usuário
    status = Column(SQLEnum(UserStatus), default=UserStatus.OFFLINE, nullable=True)

    # Role/Papel (RBAC)
    role = Column(String, default="USER", nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamentos
    # Projetos onde é owner (One-to-Many)
    owned_projects = relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")

    # Projetos onde é membro (Many-to-Many)
    member_projects = relationship(
        "Project",
        secondary="project_members",
        back_populates="members"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"
