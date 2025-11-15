from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ChatType(str, enum.Enum):
    """
    Tipo de chat
    """
    INDIVIDUAL = "individual"  # Chat 1:1 entre dois usuarios
    GROUP = "group"            # Chat em grupo com multiplos participantes


# Tabela de associacao para participantes do chat (many-to-many)
chat_participants = Table(
    "chat_participants",
    Base.metadata,
    Column("chat_id", Integer, ForeignKey("chats.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("joined_at", DateTime(timezone=True), server_default=func.now()),
    Column("last_read_at", DateTime(timezone=True), nullable=True),
)


class Chat(Base):
    """
    Modelo de Chat
    Representa uma conversa (individual ou em grupo)
    """
    __tablename__ = "chats"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Tipo de chat (individual ou grupo)
    type = Column(Enum(ChatType), nullable=False, default=ChatType.INDIVIDUAL)

    # Nome do chat (opcional para individual, obrigatorio para grupos)
    name = Column(String(200), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    participants = relationship("User", secondary=chat_participants, back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Chat(id={self.id}, type='{self.type}', name='{self.name}', participants={len(self.participants) if self.participants else 0})>"

    @property
    def is_individual(self) -> bool:
        """Verifica se e chat individual (1:1)"""
        return self.type == ChatType.INDIVIDUAL

    @property
    def is_group(self) -> bool:
        """Verifica se e chat em grupo"""
        return self.type == ChatType.GROUP

    @property
    def participant_count(self) -> int:
        """Retorna numero de participantes"""
        return len(self.participants) if self.participants else 0

    def get_participant_ids(self) -> list:
        """Retorna lista de IDs dos participantes"""
        return [p.id for p in self.participants] if self.participants else []

    def has_participant(self, user_id: int) -> bool:
        """Verifica se usuario e participante do chat"""
        return user_id in self.get_participant_ids()

    def get_chat_name_for_user(self, user_id: int) -> str:
        """
        Retorna nome do chat apropriado para um usuario especifico
        - Para chat individual: nome do outro participante
        - Para chat em grupo: nome do grupo
        """
        if self.is_group:
            return self.name or f"Grupo {self.id}"

        # Para chat individual, retorna nome do outro participante
        if self.participants and len(self.participants) == 2:
            for participant in self.participants:
                if participant.id != user_id:
                    return participant.name if participant.name else f"Usuario {participant.id}"

        return f"Chat {self.id}"

    class Config:
        from_attributes = True


# === METODOS ESTATICOS PARA FACILITAR USO ===

class ChatHelpers:
    """Metodos auxiliares para operacoes com Chat"""

    @staticmethod
    def generate_individual_chat_name(user1_name: str, user2_name: str) -> str:
        """Gera nome para chat individual (usado internamente)"""
        return f"{user1_name} & {user2_name}"

    @staticmethod
    def is_valid_group_name(name: str) -> bool:
        """Valida nome de grupo"""
        return name and len(name.strip()) >= 2 and len(name.strip()) <= 200

    @staticmethod
    def format_participant_list(participants: list) -> str:
        """Formata lista de participantes para exibicao"""
        if not participants:
            return "Nenhum participante"

        if len(participants) <= 3:
            return ", ".join([p.name for p in participants])
        else:
            first_three = ", ".join([p.name for p in participants[:3]])
            return f"{first_three} e mais {len(participants) - 3}"
