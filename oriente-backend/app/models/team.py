from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class TeamStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

# Tabela de associação para Many-to-Many entre Teams e Users (members)
team_members = Table(
    "team_members",
    Base.metadata,
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TeamStatus), nullable=False, default=TeamStatus.ACTIVE)

    # Foreign Keys
    leader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    leader = relationship("User", foreign_keys=[leader_id], back_populates="led_teams")
    members = relationship("User", secondary=team_members, back_populates="member_teams")
    projects = relationship("Project", back_populates="team")

    def __repr__(self):
        return f"<Team(id={self.id}, name='{self.name}', leader_id={self.leader_id})>"

    class Config:
        from_attributes = True