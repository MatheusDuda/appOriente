from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
import os

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.comment_attachment import CommentAttachmentResponse, CommentAttachmentListResponse
from app.services import comment_attachment_service

router = APIRouter()


@router.post(
    "/{project_id}/cards/{card_id}/comments/{comment_id}/attachments",
    response_model=CommentAttachmentResponse,
    status_code=status.HTTP_201_CREATED
)
def upload_comment_attachment(
    project_id: int,
    card_id: int,
    comment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Faz upload de um anexo para um comentário

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **comment_id**: ID do comentário
    - **file**: Arquivo a ser enviado

    Validações:
    - Usuário deve ser membro do projeto
    - Extensão do arquivo deve ser permitida
    - Tamanho do arquivo deve estar dentro do limite (10MB)

    Permissões: Membros do projeto podem fazer upload
    """
    attachment = comment_attachment_service.upload_comment_attachment(
        db=db,
        comment_id=comment_id,
        card_id=card_id,
        project_id=project_id,
        file=file,
        user_id=current_user.id
    )

    # Recarregar com relacionamentos
    db.refresh(attachment)

    return attachment


@router.get(
    "/{project_id}/cards/{card_id}/comments/{comment_id}/attachments",
    response_model=CommentAttachmentListResponse
)
def list_comment_attachments(
    project_id: int,
    card_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os anexos de um comentário

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **comment_id**: ID do comentário

    Permissões: Membros do projeto podem visualizar anexos
    """
    attachments = comment_attachment_service.get_comment_attachments(
        db=db,
        comment_id=comment_id,
        card_id=card_id,
        project_id=project_id,
        user_id=current_user.id
    )

    return CommentAttachmentListResponse(
        attachments=attachments,
        total=len(attachments)
    )


@router.get(
    "/{project_id}/cards/{card_id}/comments/{comment_id}/attachments/{attachment_id}"
)
def download_comment_attachment(
    project_id: int,
    card_id: int,
    comment_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Faz download de um anexo específico de comentário

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **comment_id**: ID do comentário
    - **attachment_id**: ID do anexo

    Em produção (Cloudinary), redireciona para URL do arquivo
    Em desenvolvimento (local), retorna o arquivo diretamente

    Permissões: Membros do projeto podem fazer download
    """
    attachment = comment_attachment_service.get_comment_attachment(
        db=db,
        attachment_id=attachment_id,
        comment_id=comment_id,
        card_id=card_id,
        project_id=project_id,
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
    "/{project_id}/cards/{card_id}/comments/{comment_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_comment_attachment(
    project_id: int,
    card_id: int,
    comment_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta um anexo de comentário

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **comment_id**: ID do comentário
    - **attachment_id**: ID do anexo

    Remove tanto o arquivo físico quanto o registro no banco de dados

    Permissões: Membros do projeto podem deletar anexos
    """
    comment_attachment_service.delete_comment_attachment(
        db=db,
        attachment_id=attachment_id,
        comment_id=comment_id,
        card_id=card_id,
        project_id=project_id,
        user_id=current_user.id
    )

    return None
