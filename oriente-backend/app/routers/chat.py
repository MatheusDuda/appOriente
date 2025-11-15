from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.chat import ChatType
from app.schemas.chat import (
    ChatCreate, ChatUpdate, ChatResponse, ChatDetailResponse,
    ChatMessageCreate, ChatMessageUpdate, ChatMessageResponse, ChatMessageListResponse,
    AddParticipantRequest, UpdateLastReadRequest
)
from app.services.chat_service import ChatService
from app.services.chat_message_service import ChatMessageService

router = APIRouter()


@router.post("/chats", response_model=ChatDetailResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_data: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Criar novo chat (individual ou em grupo)

    - **type**: Tipo do chat ("individual" ou "group")
    - **name**: Nome do chat (obrigatório para grupos, opcional para individual)
    - **participant_ids**: Lista de IDs dos participantes (além do criador)

    **Para chat individual:**
    - Deve ter apenas 1 participante (além do criador)
    - Se já existir chat entre os dois usuários, retorna o existente

    **Para chat em grupo:**
    - Deve ter no mínimo 2 participantes (além do criador = 3 total)
    - Nome é obrigatório

    Permissões: Qualquer usuário autenticado
    """
    if chat_data.type == ChatType.INDIVIDUAL:
        # Chat individual: deve ter exatamente 1 outro participante
        if len(chat_data.participant_ids) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chat individual deve ter exatamente 1 outro participante"
            )

        chat = ChatService.create_individual_chat(
            db,
            current_user.id,
            chat_data.participant_ids[0]
        )
    else:
        # Chat em grupo
        chat = ChatService.create_group_chat(db, chat_data, current_user.id)

    # Retornar detalhes do chat
    return ChatService.get_chat_by_id(db, chat.id, current_user.id)


@router.get("/chats", response_model=List[ChatResponse])
def get_user_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar todos os chats do usuário autenticado

    Retorna lista ordenada por última atividade (mais recentes primeiro)

    Cada chat inclui:
    - Informações básicas do chat
    - Lista de participantes
    - Preview da última mensagem
    - Contagem de mensagens não lidas

    Permissões: Apenas chats onde o usuário é participante
    """
    return ChatService.get_user_chats(db, current_user.id)


@router.get("/chats/{chat_id}", response_model=ChatDetailResponse)
def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar detalhes de um chat específico

    - **chat_id**: ID do chat

    Permissões: Apenas participantes do chat
    """
    return ChatService.get_chat_by_id(db, chat_id, current_user.id)


@router.get("/chats/{chat_id}/messages", response_model=ChatMessageListResponse)
def get_chat_messages(
    chat_id: int,
    limit: int = Query(50, ge=1, le=100, description="Número de mensagens por página"),
    offset: int = Query(0, ge=0, description="Número de mensagens a pular"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar mensagens de um chat (paginadas)

    - **chat_id**: ID do chat
    - **limit**: Número de mensagens por página (padrão: 50, máximo: 100)
    - **offset**: Número de mensagens a pular (para paginação)

    Retorna mensagens ordenadas da mais recente para a mais antiga.

    Cada mensagem inclui flags `can_edit` e `can_delete` que indicam se o usuário
    atual pode modificar a mensagem (apenas autor, dentro de 10 minutos).

    Permissões: Apenas participantes do chat
    """
    return ChatMessageService.get_chat_messages(db, chat_id, current_user.id, limit, offset)


@router.post("/chats/{chat_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    chat_id: int,
    message_data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enviar mensagem em um chat

    - **chat_id**: ID do chat
    - **content**: Conteúdo da mensagem

    A mensagem será enviada e notificações serão criadas para os outros participantes.

    **Nota**: Para comunicação em tempo real, use o WebSocket endpoint em `/ws/chat/{chat_id}`

    Permissões: Apenas participantes do chat
    """
    return ChatMessageService.send_message(db, chat_id, message_data, current_user.id)


@router.put("/chats/{chat_id}/messages/{message_id}", response_model=ChatMessageResponse)
def edit_message(
    chat_id: int,
    message_id: int,
    message_data: ChatMessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Editar mensagem

    - **chat_id**: ID do chat
    - **message_id**: ID da mensagem
    - **content**: Novo conteúdo da mensagem

    Restrições:
    - Apenas o autor pode editar
    - Dentro de 10 minutos após envio

    A mensagem será marcada como editada.

    Permissões: Apenas autor da mensagem (dentro do prazo)
    """
    return ChatMessageService.edit_message(db, message_id, message_data, current_user.id)


@router.delete("/chats/{chat_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    chat_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar mensagem

    - **chat_id**: ID do chat
    - **message_id**: ID da mensagem

    Restrições:
    - Apenas o autor pode deletar
    - Dentro de 10 minutos após envio

    Permissões: Apenas autor da mensagem (dentro do prazo)
    """
    ChatMessageService.delete_message(db, message_id, current_user.id)


@router.put("/chats/{chat_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_as_read(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marcar chat como lido

    - **chat_id**: ID do chat

    Atualiza o timestamp de última leitura do usuário,
    zerando a contagem de mensagens não lidas.

    Permissões: Apenas participantes do chat
    """
    ChatService.update_last_read(db, chat_id, current_user.id)


@router.put("/chats/{chat_id}", response_model=ChatDetailResponse)
def update_chat(
    chat_id: int,
    chat_data: ChatUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar nome do grupo

    - **chat_id**: ID do chat
    - **name**: Novo nome do grupo

    **Nota**: Apenas grupos podem ter o nome alterado.
    Chats individuais usam automaticamente o nome do outro participante.

    Permissões: Apenas participantes do grupo
    """
    chat = ChatService.update_group_name(db, chat_id, chat_data.name, current_user.id)
    return ChatService.get_chat_by_id(db, chat.id, current_user.id)


@router.post("/chats/{chat_id}/participants", response_model=ChatDetailResponse)
def add_participant(
    chat_id: int,
    participant_data: AddParticipantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adicionar participante a um grupo

    - **chat_id**: ID do chat
    - **user_id**: ID do usuário a ser adicionado

    **Nota**: Apenas grupos podem ter participantes adicionados.

    Permissões: Apenas participantes do grupo
    """
    chat = ChatService.add_participant(db, chat_id, participant_data.user_id, current_user.id)
    return ChatService.get_chat_by_id(db, chat.id, current_user.id)


@router.delete("/chats/{chat_id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_participant(
    chat_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remover participante de um grupo

    - **chat_id**: ID do chat
    - **user_id**: ID do usuário a ser removido

    **Nota**:
    - Apenas grupos podem ter participantes removidos
    - Se o grupo ficar com menos de 2 participantes, será deletado automaticamente
    - Participantes podem remover a si mesmos (sair do grupo)

    Permissões: Apenas participantes do grupo
    """
    ChatService.remove_participant(db, chat_id, user_id, current_user.id)
