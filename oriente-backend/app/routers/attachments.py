from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import os

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.attachment import AttachmentResponse, AttachmentListResponse
from app.services import attachment_service

router = APIRouter()


@router.post(
    "/{project_id}/cards/{card_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED
)
def upload_attachment(
    project_id: int,
    card_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Faz upload de um anexo para um card

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **file**: Arquivo a ser enviado

    Validações:
    - Usuário deve ser membro do projeto
    - Extensão do arquivo deve ser permitida
    - Tamanho do arquivo deve estar dentro do limite (10MB)
    - Projeto não pode exceder quota de armazenamento (100MB)

    Permissões: Membros do projeto podem fazer upload
    """
    attachment = attachment_service.upload_attachment(
        db=db,
        card_id=card_id,
        project_id=project_id,
        file=file,
        user_id=current_user.id
    )

    # Recarregar com relacionamentos
    db.refresh(attachment)

    return attachment


@router.get(
    "/{project_id}/cards/{card_id}/attachments",
    response_model=AttachmentListResponse
)
def list_card_attachments(
    project_id: int,
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os anexos de um card

    - **project_id**: ID do projeto
    - **card_id**: ID do card

    Permissões: Membros do projeto podem visualizar anexos
    """
    attachments = attachment_service.get_card_attachments(
        db=db,
        card_id=card_id,
        project_id=project_id,
        user_id=current_user.id
    )

    return AttachmentListResponse(
        attachments=attachments,
        total=len(attachments)
    )


@router.get(
    "/{project_id}/cards/{card_id}/attachments/{attachment_id}"
)
def download_attachment(
    project_id: int,
    card_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Faz download de um anexo específico

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **attachment_id**: ID do anexo

    Em produção (Cloudinary), redireciona para URL do arquivo
    Em desenvolvimento (local), retorna o arquivo diretamente

    Permissões: Membros do projeto podem fazer download
    """
    attachment = attachment_service.get_attachment(
        db=db,
        attachment_id=attachment_id,
        card_id=card_id,
        project_id=project_id,
        user_id=current_user.id
    )

    # Se file_path for uma URL (Cloudinary), redirecionar
    if attachment.file_path.startswith("http://") or attachment.file_path.startswith("https://"):
        return RedirectResponse(url=attachment.file_path)

    # Caso contrário, servir arquivo local
    # Verificar se arquivo físico existe
    if not os.path.exists(attachment.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo não encontrado no servidor"
        )

    # Retornar arquivo com headers apropriados
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.filename,
        media_type=attachment.mime_type
    )


@router.delete(
    "/{project_id}/cards/{card_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_attachment(
    project_id: int,
    card_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta um anexo

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **attachment_id**: ID do anexo

    Remove tanto o arquivo físico quanto o registro no banco de dados

    Permissões: Membros do projeto podem deletar anexos
    """
    attachment_service.delete_attachment(
        db=db,
        attachment_id=attachment_id,
        card_id=card_id,
        project_id=project_id,
        user_id=current_user.id
    )

    return None


@router.get(
    "/{project_id}/storage",
    response_model=dict
)
def get_project_storage(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna informações sobre o uso de armazenamento do projeto

    - **project_id**: ID do projeto

    Retorna:
    - Espaço usado (bytes e MB)
    - Quota total (bytes e MB)
    - Espaço disponível (bytes e MB)
    - Percentual de uso

    Permissões: Membros do projeto podem visualizar
    """
    return attachment_service.get_project_storage_info(
        db=db,
        project_id=project_id,
        user_id=current_user.id
    )
