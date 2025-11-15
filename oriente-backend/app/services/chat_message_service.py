from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from app.models.chat import Chat
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.schemas.chat import (
    ChatMessageCreate, ChatMessageUpdate, ChatMessageResponse,
    ChatMessageSender, ChatMessageListResponse
)
from app.services.chat_service import ChatService


class ChatMessageService:
    """Service para operações com mensagens de chat"""

    # Tempo limite para edição de mensagem (10 minutos)
    EDIT_TIME_LIMIT_MINUTES = 10

    @staticmethod
    def _can_modify_message(message: ChatMessage, user_id: int) -> bool:
        """
        Verifica se usuário pode modificar (editar/deletar) mensagem
        - Deve ser o autor da mensagem
        - Deve estar dentro do tempo limite
        """
        if message.sender_id != user_id:
            return False

        time_since_creation = datetime.utcnow() - message.created_at.replace(tzinfo=None)
        return time_since_creation <= timedelta(minutes=ChatMessageService.EDIT_TIME_LIMIT_MINUTES)

    @staticmethod
    def _create_message_notifications(db: Session, message: ChatMessage, chat: Chat) -> None:
        """
        Cria notificações para participantes do chat (exceto remetente)
        """
        sender = message.sender

        for participant in chat.participants:
            # Não notificar o próprio remetente
            if participant.id == message.sender_id:
                continue

            # Nome do chat para contexto
            chat_name = chat.get_chat_name_for_user(participant.id)

            notification = Notification(
                type=NotificationType.SYSTEM,
                title=f"Nova mensagem em {chat_name}",
                message=f"{sender.name if sender else 'Alguém'}: {message.content[:50]}{'...' if len(message.content) > 50 else ''}",
                recipient_user_id=participant.id,
                action_url=f"/chats/{chat.id}"
            )

            db.add(notification)

    @staticmethod
    def send_message(db: Session, chat_id: int, message_data: ChatMessageCreate, sender_id: int) -> ChatMessageResponse:
        """
        Envia mensagem em um chat
        """
        # Verificar se usuário tem acesso ao chat
        if not ChatService._can_access_chat(db, chat_id, sender_id):
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

        # Buscar sender
        sender = db.query(User).filter(User.id == sender_id).first()

        # Criar mensagem
        message = ChatMessage(
            chat_id=chat_id,
            sender_id=sender_id,
            content=message_data.content,
            is_edited=False
        )

        db.add(message)

        # Atualizar updated_at do chat
        chat.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(message)

        # Criar notificações para participantes
        ChatMessageService._create_message_notifications(db, message, chat)
        db.commit()

        # Marcar como lida automaticamente para o remetente
        ChatService.update_last_read(db, chat_id, sender_id)

        # Montar response
        sender_data = None
        if sender:
            sender_data = ChatMessageSender(
                id=sender.id,
                name=sender.name,
                email=sender.email
            )

        return ChatMessageResponse(
            id=message.id,
            chat_id=message.chat_id,
            sender_id=message.sender_id,
            content=message.content,
            created_at=message.created_at,
            updated_at=message.updated_at,
            is_edited=message.is_edited,
            edited_at=message.edited_at,
            sender=sender_data,
            can_edit=ChatMessageService._can_modify_message(message, sender_id),
            can_delete=ChatMessageService._can_modify_message(message, sender_id)
        )

    @staticmethod
    def get_chat_messages(
        db: Session,
        chat_id: int,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> ChatMessageListResponse:
        """
        Busca mensagens de um chat (paginadas, mais recentes primeiro)
        """
        # Verificar acesso
        if not ChatService._can_access_chat(db, chat_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem acesso a este chat"
            )

        # Contar total de mensagens
        total = db.query(ChatMessage).filter(ChatMessage.chat_id == chat_id).count()

        # Buscar mensagens
        messages = db.query(ChatMessage).filter(
            ChatMessage.chat_id == chat_id
        ).options(
            joinedload(ChatMessage.sender)
        ).order_by(
            ChatMessage.created_at.desc()
        ).limit(limit).offset(offset).all()

        # Montar response
        messages_response = []
        for message in messages:
            sender_data = None
            if message.sender:
                sender_data = ChatMessageSender(
                    id=message.sender.id,
                    name=message.sender.name,
                    email=message.sender.email
                )

            messages_response.append(ChatMessageResponse(
                id=message.id,
                chat_id=message.chat_id,
                sender_id=message.sender_id,
                content=message.content,
                created_at=message.created_at,
                updated_at=message.updated_at,
                is_edited=message.is_edited,
                edited_at=message.edited_at,
                sender=sender_data,
                can_edit=ChatMessageService._can_modify_message(message, user_id),
                can_delete=ChatMessageService._can_modify_message(message, user_id)
            ))

        has_more = (offset + limit) < total

        return ChatMessageListResponse(
            total=total,
            messages=messages_response,
            has_more=has_more
        )

    @staticmethod
    def edit_message(
        db: Session,
        message_id: int,
        message_data: ChatMessageUpdate,
        user_id: int
    ) -> ChatMessageResponse:
        """
        Edita mensagem (apenas autor, dentro do tempo limite)
        """
        # Buscar mensagem
        message = db.query(ChatMessage).filter(ChatMessage.id == message_id).options(
            joinedload(ChatMessage.sender)
        ).first()

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mensagem não encontrada"
            )

        # Verificar permissão
        if not ChatMessageService._can_modify_message(message, user_id):
            if message.sender_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Você não pode editar esta mensagem"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Mensagens só podem ser editadas dentro de {ChatMessageService.EDIT_TIME_LIMIT_MINUTES} minutos"
                )

        # Atualizar mensagem
        message.content = message_data.content
        message.is_edited = True
        message.edited_at = datetime.utcnow()

        db.commit()
        db.refresh(message)

        # Montar response
        sender_data = None
        if message.sender:
            sender_data = ChatMessageSender(
                id=message.sender.id,
                name=message.sender.name,
                email=message.sender.email
            )

        return ChatMessageResponse(
            id=message.id,
            chat_id=message.chat_id,
            sender_id=message.sender_id,
            content=message.content,
            created_at=message.created_at,
            updated_at=message.updated_at,
            is_edited=message.is_edited,
            edited_at=message.edited_at,
            sender=sender_data,
            can_edit=ChatMessageService._can_modify_message(message, user_id),
            can_delete=ChatMessageService._can_modify_message(message, user_id)
        )

    @staticmethod
    def delete_message(db: Session, message_id: int, user_id: int) -> None:
        """
        Deleta mensagem (apenas autor, dentro do tempo limite)
        """
        # Buscar mensagem
        message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()

        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mensagem não encontrada"
            )

        # Verificar permissão
        if not ChatMessageService._can_modify_message(message, user_id):
            if message.sender_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Você não pode deletar esta mensagem"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Mensagens só podem ser deletadas dentro de {ChatMessageService.EDIT_TIME_LIMIT_MINUTES} minutos"
                )

        # Deletar mensagem
        db.delete(message)
        db.commit()
