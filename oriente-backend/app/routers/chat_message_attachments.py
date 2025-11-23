from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session, joinedload
import os

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.chat_message_attachment import ChatMessageAttachment
from app.schemas.chat_message_attachment import ChatMessageAttachmentResponse, ChatMessageAttachmentListResponse
from app.services import chat_message_attachment_service

router = APIRouter()


@router.post(
    "/{chat_id}/messages/{message_id}/attachments",
    response_model=ChatMessageAttachmentResponse,
    status_code=status.HTTP_201_CREATED
)
def upload_message_attachment(
    chat_id: int,
    message_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Faz upload de um anexo para uma mensagem de chat

    - **chat_id**: ID do chat
    - **message_id**: ID da mensagem
    - **file**: Arquivo a ser enviado

    Validações:
    - Usuário deve ser participante do chat
    - Extensão do arquivo deve ser permitida
    - Tamanho do arquivo deve estar dentro do limite (10MB)

    Permissões: Participantes do chat podem fazer upload
    """
    attachment = chat_message_attachment_service.upload_message_attachment(
        db=db,
        chat_id=chat_id,
        message_id=message_id,
        file=file,
        user_id=current_user.id
    )

    # Recarregar com relacionamentos usando eager loading
    attachment = db.query(ChatMessageAttachment).options(
        joinedload(ChatMessageAttachment.uploaded_by)
    ).filter(ChatMessageAttachment.id == attachment.id).first()

    return attachment


@router.get(
    "/{chat_id}/messages/{message_id}/attachments",
    response_model=ChatMessageAttachmentListResponse
)
def list_message_attachments(
    chat_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os anexos de uma mensagem de chat

    - **chat_id**: ID do chat
    - **message_id**: ID da mensagem

    Permissões: Participantes do chat podem visualizar anexos
    """
    attachments = chat_message_attachment_service.get_message_attachments(
        db=db,
        chat_id=chat_id,
        message_id=message_id,
        user_id=current_user.id
    )

    return ChatMessageAttachmentListResponse(
        attachments=attachments,
        total=len(attachments)
    )


@router.get(
    "/{chat_id}/messages/{message_id}/attachments/{attachment_id}"
)
def download_message_attachment(
    chat_id: int,
    message_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Faz download de um anexo específico de mensagem de chat

    - **chat_id**: ID do chat
    - **message_id**: ID da mensagem
    - **attachment_id**: ID do anexo

    Em produção (Cloudinary), redireciona para URL do arquivo
    Em desenvolvimento (local), retorna o arquivo diretamente

    Permissões: Participantes do chat podem fazer download
    """
    attachment = chat_message_attachment_service.get_message_attachment(
        db=db,
        chat_id=chat_id,
        message_id=message_id,
        attachment_id=attachment_id,
        user_id=current_user.id
    )

    # Se file_path for uma URL (Cloudinary), redirecionar
    if attachment.file_path.startswith("http://") or attachment.file_path.startswith("https://"):
        return RedirectResponse(url=attachment.file_path)

    # Caso contrário, servir arquivo local
    if not os.path.exists(attachment.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo não encontrado no servidor"
        )

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.filename,
        media_type=attachment.mime_type
    )


@router.delete(
    "/{chat_id}/messages/{message_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_message_attachment(
    chat_id: int,
    message_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta um anexo de mensagem de chat

    - **chat_id**: ID do chat
    - **message_id**: ID da mensagem
    - **attachment_id**: ID do anexo

    Remove tanto o arquivo físico quanto o registro no banco de dados

    Permissões: Participantes do chat podem deletar anexos
    """
    chat_message_attachment_service.delete_message_attachment(
        db=db,
        chat_id=chat_id,
        message_id=message_id,
        attachment_id=attachment_id,
        user_id=current_user.id
    )

    return None
