from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, select
from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException, status

from app.models.chat import Chat, ChatType, chat_participants, ChatHelpers
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.schemas.chat import (
    ChatCreate, ChatUpdate, ChatResponse, ChatDetailResponse,
    ChatParticipantResponse, ChatLastMessage
)


class ChatService:
    """Service para operações com Chat"""

    @staticmethod
    def _can_access_chat(db: Session, chat_id: int, user_id: int) -> bool:
        """
        Verifica se usuário tem acesso ao chat (é participante)
        """
        # Query para verificar se o usuário é participante do chat
        result = db.execute(
            select(chat_participants).where(
                and_(
                    chat_participants.c.chat_id == chat_id,
                    chat_participants.c.user_id == user_id
                )
            )
        ).first()

        return result is not None

    @staticmethod
    def _calculate_unread_count(db: Session, chat_id: int, user_id: int) -> int:
        """
        Calcula número de mensagens não lidas para o usuário
        """
        # Buscar last_read_at do usuário
        result = db.execute(
            select(chat_participants.c.last_read_at).where(
                and_(
                    chat_participants.c.chat_id == chat_id,
                    chat_participants.c.user_id == user_id
                )
            )
        ).first()

        if not result or not result[0]:
            # Se nunca leu, contar todas as mensagens
            count = db.query(ChatMessage).filter(
                ChatMessage.chat_id == chat_id
            ).count()
        else:
            last_read_at = result[0]
            # Contar mensagens após last_read_at
            count = db.query(ChatMessage).filter(
                and_(
                    ChatMessage.chat_id == chat_id,
                    ChatMessage.created_at > last_read_at
                )
            ).count()

        return count

    @staticmethod
    def _get_last_message(db: Session, chat_id: int) -> Optional[ChatLastMessage]:
        """
        Retorna a última mensagem do chat
        """
        message = db.query(ChatMessage).filter(
            ChatMessage.chat_id == chat_id
        ).order_by(ChatMessage.created_at.desc()).first()

        if not message:
            return None

        sender_name = message.sender.name if message.sender else "Usuário deletado"

        return ChatLastMessage(
            id=message.id,
            content=message.content[:50] + "..." if len(message.content) > 50 else message.content,
            sender_name=sender_name,
            created_at=message.created_at
        )

    @staticmethod
    def create_individual_chat(db: Session, user_id: int, other_user_id: int) -> Chat:
        """
        Cria chat individual (1:1) entre dois usuários
        Se já existir, retorna o existente
        """
        if user_id == other_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível criar chat consigo mesmo"
            )

        # Verificar se outro usuário existe
        other_user = db.query(User).filter(User.id == other_user_id).first()
        if not other_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuário com ID {other_user_id} não encontrado"
            )

        # Verificar se já existe chat individual entre os dois usuários
        # Buscar chats individuais do usuário atual
        user_chats = db.query(Chat).join(
            chat_participants, Chat.id == chat_participants.c.chat_id
        ).filter(
            and_(
                Chat.type == ChatType.INDIVIDUAL,
                chat_participants.c.user_id == user_id
            )
        ).options(joinedload(Chat.participants)).all()

        # Verificar se algum desses chats tem o outro usuário como participante
        for chat in user_chats:
            participant_ids = chat.get_participant_ids()
            if other_user_id in participant_ids and len(participant_ids) == 2:
                return chat

        # Criar novo chat
        current_user = db.query(User).filter(User.id == user_id).first()

        chat = Chat(
            type=ChatType.INDIVIDUAL,
            name=ChatHelpers.generate_individual_chat_name(current_user.name, other_user.name)
        )

        # Adicionar participantes
        chat.participants.append(current_user)
        chat.participants.append(other_user)

        db.add(chat)
        db.commit()
        db.refresh(chat)

        return chat

    @staticmethod
    def create_group_chat(db: Session, chat_data: ChatCreate, creator_id: int) -> Chat:
        """
        Cria chat em grupo
        """
        if chat_data.type != ChatType.GROUP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use este método apenas para criar grupos"
            )

        # Validar nome do grupo
        if not chat_data.name or not ChatHelpers.is_valid_group_name(chat_data.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome do grupo é obrigatório e deve ter entre 2 e 200 caracteres"
            )

        # Validar número de participantes (mínimo 2 + criador = 3 para grupos)
        if len(chat_data.participant_ids) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grupo deve ter no mínimo 3 participantes (incluindo você)"
            )

        # Buscar participantes
        participant_ids = set(chat_data.participant_ids)
        participant_ids.add(creator_id)  # Incluir criador

        participants = db.query(User).filter(User.id.in_(participant_ids)).all()

        if len(participants) != len(participant_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Um ou mais usuários não encontrados"
            )

        # Criar chat
        chat = Chat(
            type=ChatType.GROUP,
            name=chat_data.name
        )

        chat.participants.extend(participants)

        db.add(chat)
        db.commit()
        db.refresh(chat)

        return chat

    @staticmethod
    def get_user_chats(db: Session, user_id: int) -> List[ChatResponse]:
        """
        Lista todos os chats do usuário
        """
        # Buscar chats com participants carregados
        chats = db.query(Chat).join(
            chat_participants, Chat.id == chat_participants.c.chat_id
        ).filter(
            chat_participants.c.user_id == user_id
        ).options(
            joinedload(Chat.participants)
        ).order_by(Chat.updated_at.desc()).all()

        # Montar response com dados calculados
        result = []
        for chat in chats:
            # Nome apropriado para o usuário
            display_name = chat.get_chat_name_for_user(user_id)

            # Participantes
            participants_data = []
            for participant in chat.participants:
                # Buscar dados de joined_at e last_read_at da tabela associativa
                participant_info = db.execute(
                    select(chat_participants).where(
                        and_(
                            chat_participants.c.chat_id == chat.id,
                            chat_participants.c.user_id == participant.id
                        )
                    )
                ).first()

                participants_data.append(ChatParticipantResponse(
                    id=participant.id,
                    name=participant.name,
                    email=participant.email,
                    joined_at=participant_info[2] if participant_info else None,  # joined_at
                    last_read_at=participant_info[3] if participant_info else None  # last_read_at
                ))

            # Última mensagem
            last_message = ChatService._get_last_message(db, chat.id)

            # Mensagens não lidas
            unread_count = ChatService._calculate_unread_count(db, chat.id, user_id)

            chat_response = ChatResponse(
                id=chat.id,
                type=chat.type,
                name=chat.name,
                display_name=display_name,
                participant_count=len(chat.participants),
                participants=participants_data,
                last_message=last_message,
                unread_count=unread_count,
                created_at=chat.created_at,
                updated_at=chat.updated_at
            )

            result.append(chat_response)

        return result

    @staticmethod
    def get_chat_by_id(db: Session, chat_id: int, user_id: int) -> ChatDetailResponse:
        """
        Busca chat por ID (verifica permissão)
        """
        # Verificar permissão
        if not ChatService._can_access_chat(db, chat_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem acesso a este chat"
            )

        # Buscar chat
        chat = db.query(Chat).filter(Chat.id == chat_id).options(
            joinedload(Chat.participants)
        ).first()

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat não encontrado"
            )

        # Nome apropriado
        display_name = chat.get_chat_name_for_user(user_id)

        # Participantes
        participants_data = []
        for participant in chat.participants:
            participant_info = db.execute(
                select(chat_participants).where(
                    and_(
                        chat_participants.c.chat_id == chat.id,
                        chat_participants.c.user_id == participant.id
                    )
                )
            ).first()

            participants_data.append(ChatParticipantResponse(
                id=participant.id,
                name=participant.name,
                email=participant.email,
                joined_at=participant_info[2] if participant_info else None,
                last_read_at=participant_info[3] if participant_info else None
            ))

        # Última mensagem
        last_message = ChatService._get_last_message(db, chat.id)

        # Mensagens não lidas
        unread_count = ChatService._calculate_unread_count(db, chat.id, user_id)

        return ChatDetailResponse(
            id=chat.id,
            type=chat.type,
            name=chat.name,
            display_name=display_name,
            participant_count=len(chat.participants),
            participants=participants_data,
            last_message=last_message,
            unread_count=unread_count,
            created_at=chat.created_at,
            updated_at=chat.updated_at
        )

    @staticmethod
    def add_participant(db: Session, chat_id: int, new_user_id: int, requester_id: int) -> Chat:
        """
        Adiciona participante a um grupo (apenas grupos)
        """
        # Verificar permissão
        if not ChatService._can_access_chat(db, chat_id, requester_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem acesso a este chat"
            )

        # Buscar chat
        chat = db.query(Chat).filter(Chat.id == chat_id).options(
            joinedload(Chat.participants)
        ).first()

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat não encontrado"
            )

        # Verificar se é grupo
        if chat.type != ChatType.GROUP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas grupos podem ter participantes adicionados"
            )

        # Verificar se usuário já é participante
        if chat.has_participant(new_user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário já é participante deste grupo"
            )

        # Buscar novo usuário
        new_user = db.query(User).filter(User.id == new_user_id).first()
        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Adicionar participante
        chat.participants.append(new_user)

        db.commit()
        db.refresh(chat)

        return chat

    @staticmethod
    def remove_participant(db: Session, chat_id: int, user_to_remove_id: int, requester_id: int) -> Chat:
        """
        Remove participante de um grupo
        """
        # Verificar permissão
        if not ChatService._can_access_chat(db, chat_id, requester_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem acesso a este chat"
            )

        # Buscar chat
        chat = db.query(Chat).filter(Chat.id == chat_id).options(
            joinedload(Chat.participants)
        ).first()

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat não encontrado"
            )

        # Verificar se é grupo
        if chat.type != ChatType.GROUP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas grupos podem ter participantes removidos"
            )

        # Verificar se usuário é participante
        if not chat.has_participant(user_to_remove_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário não é participante deste grupo"
            )

        # Remover participante
        user_to_remove = db.query(User).filter(User.id == user_to_remove_id).first()
        if user_to_remove:
            chat.participants.remove(user_to_remove)

        # Verificar se grupo ficou vazio ou com apenas 1 pessoa
        if len(chat.participants) < 2:
            # Deletar o grupo
            db.delete(chat)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_200_OK,
                detail="Grupo deletado pois ficou com menos de 2 participantes"
            )

        db.commit()
        db.refresh(chat)

        return chat

    @staticmethod
    def update_last_read(db: Session, chat_id: int, user_id: int) -> None:
        """
        Atualiza timestamp de última leitura do usuário no chat
        """
        # Verificar permissão
        if not ChatService._can_access_chat(db, chat_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem acesso a este chat"
            )

        # Atualizar last_read_at
        db.execute(
            chat_participants.update().where(
                and_(
                    chat_participants.c.chat_id == chat_id,
                    chat_participants.c.user_id == user_id
                )
            ).values(last_read_at=datetime.utcnow())
        )

        db.commit()

    @staticmethod
    def update_group_name(db: Session, chat_id: int, new_name: str, user_id: int) -> Chat:
        """
        Atualiza nome do grupo
        """
        # Verificar permissão
        if not ChatService._can_access_chat(db, chat_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem acesso a este chat"
            )

        # Buscar chat
        chat = db.query(Chat).filter(Chat.id == chat_id).first()

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat não encontrado"
            )

        # Verificar se é grupo
        if chat.type != ChatType.GROUP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas grupos podem ter o nome alterado"
            )

        # Validar nome
        if not ChatHelpers.is_valid_group_name(new_name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome do grupo deve ter entre 2 e 200 caracteres"
            )

        # Atualizar nome
        chat.name = new_name

        db.commit()
        db.refresh(chat)

        return chat
