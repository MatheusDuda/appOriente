import os
import uuid
from typing import List
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
import mimetypes

from app.models.comment_attachment import CommentAttachment
from app.models.comment import Comment
from app.models.Card import Card
from app.core.config import settings
from app.services.project_service import ProjectService
from app.services.cloudinary_service import cloudinary_service


def _get_allowed_extensions() -> set:
    """Retorna set de extensões permitidas"""
    return set(settings.ALLOWED_EXTENSIONS.split(","))


def _validate_file_extension(filename: str) -> bool:
    """Valida se a extensão do arquivo é permitida"""
    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    return extension in _get_allowed_extensions()


def _validate_file_size(file_size: int) -> bool:
    """Valida se o tamanho do arquivo está dentro do limite"""
    return file_size <= settings.MAX_UPLOAD_SIZE


def _sanitize_filename(filename: str) -> str:
    """Remove caracteres perigosos do nome do arquivo"""
    filename = os.path.basename(filename)
    name, ext = os.path.splitext(filename)
    name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    return f"{name}{ext}"


def _save_file(file: UploadFile, comment_id: int) -> tuple[str, str, int]:
    """
    Salva arquivo no Cloudinary (produção) ou disco local (desenvolvimento)

    Returns:
        tuple: (file_path_or_url, mime_type, file_size)
    """
    safe_filename = _sanitize_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{safe_filename}"
    mime_type = file.content_type or mimetypes.guess_type(safe_filename)[0] or "application/octet-stream"

    try:
        content = file.file.read()
        file_size = len(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao ler arquivo: {str(e)}"
        )

    if settings.use_cloudinary:
        try:
            folder = f"oriente/comments/{comment_id}"
            result = cloudinary_service.upload_from_bytes(
                file_bytes=content,
                filename=safe_filename,
                folder=folder
            )
            return result["url"], mime_type, file_size
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao enviar arquivo para Cloudinary: {str(e)}"
            )
    else:
        comment_dir = os.path.join(settings.UPLOAD_DIR, "comments", str(comment_id))
        os.makedirs(comment_dir, exist_ok=True)
        file_path = os.path.join(comment_dir, unique_filename)

        try:
            with open(file_path, "wb") as buffer:
                buffer.write(content)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao salvar arquivo: {str(e)}"
            )

        return file_path, mime_type, file_size


def _delete_file(file_path: str) -> bool:
    """Remove arquivo físico do disco (desenvolvimento)"""
    if file_path.startswith("http://") or file_path.startswith("https://"):
        return True

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False


def upload_comment_attachment(
    db: Session,
    comment_id: int,
    project_id: int,
    card_id: int,
    file: UploadFile,
    user_id: int
) -> CommentAttachment:
    """
    Faz upload de um anexo para um comentário

    Validações:
    - Usuário tem permissão de acesso ao projeto
    - Card existe e pertence ao projeto
    - Comment existe e pertence ao card
    - Extensão do arquivo é permitida
    - Tamanho do arquivo está dentro do limite
    """
    # Verificar permissões de acesso ao projeto
    if not ProjectService.user_can_access_project(db, project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este projeto"
        )

    # Verificar se o card existe e pertence ao projeto
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.project_id == project_id
    ).first()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card não encontrado neste projeto"
        )

    # Verificar se o comentário existe e pertence ao card
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.card_id == card_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentário não encontrado neste card"
        )

    # Validar extensão do arquivo
    if not _validate_file_extension(file.filename):
        allowed = ", ".join(_get_allowed_extensions())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Extensões permitidas: {allowed}"
        )

    # Validar tamanho do arquivo
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if not _validate_file_size(file_size):
        max_size_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo muito grande. Tamanho máximo: {max_size_mb:.1f}MB"
        )

    # Salvar arquivo físico
    file_path, mime_type, actual_file_size = _save_file(file, comment_id)

    # Criar registro no banco
    try:
        attachment = CommentAttachment(
            filename=file.filename,
            file_path=file_path,
            file_size=actual_file_size,
            mime_type=mime_type,
            comment_id=comment_id,
            uploaded_by_id=user_id
        )

        db.add(attachment)
        db.commit()
        db.refresh(attachment)

        return attachment

    except Exception as e:
        _delete_file(file_path)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar anexo no banco de dados: {str(e)}"
        )


def get_comment_attachments(
    db: Session,
    comment_id: int,
    project_id: int,
    card_id: int,
    user_id: int
) -> List[CommentAttachment]:
    """Retorna todos os anexos de um comentário"""
    # Verificar permissões
    if not ProjectService.user_can_access_project(db, project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este projeto"
        )

    # Verificar se o comentário existe
    comment = db.query(Comment).join(Card).filter(
        Comment.id == comment_id,
        Comment.card_id == card_id,
        Card.project_id == project_id
    ).first()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentário não encontrado"
        )

    attachments = db.query(CommentAttachment).filter(
        CommentAttachment.comment_id == comment_id
    ).all()

    return attachments


def get_comment_attachment(
    db: Session,
    attachment_id: int,
    comment_id: int,
    project_id: int,
    card_id: int,
    user_id: int
) -> CommentAttachment:
    """Retorna um anexo específico"""
    if not ProjectService.user_can_access_project(db, project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este projeto"
        )

    attachment = db.query(CommentAttachment).join(Comment).join(Card).filter(
        CommentAttachment.id == attachment_id,
        CommentAttachment.comment_id == comment_id,
        Comment.card_id == card_id,
        Card.project_id == project_id
    ).first()

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )

    return attachment


def delete_comment_attachment(
    db: Session,
    attachment_id: int,
    comment_id: int,
    project_id: int,
    card_id: int,
    user_id: int
) -> bool:
    """Deleta um anexo"""
    if not ProjectService.user_can_access_project(db, project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este projeto"
        )

    attachment = db.query(CommentAttachment).join(Comment).join(Card).filter(
        CommentAttachment.id == attachment_id,
        CommentAttachment.comment_id == comment_id,
        Comment.card_id == card_id,
        Card.project_id == project_id
    ).first()

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )

    # Deletar arquivo físico
    _delete_file(attachment.file_path)

    # Deletar registro do banco
    try:
        db.delete(attachment)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar anexo: {str(e)}"
        )
