import os
import uuid
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import mimetypes

from app.models.attachment import Attachment
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


def _get_project_storage_usage(db: Session, project_id: int) -> int:
    """Calcula o total de bytes usado por um projeto"""
    total = db.query(func.sum(Attachment.file_size)).join(Card).filter(
        Card.project_id == project_id
    ).scalar()

    return total or 0


def _check_project_quota(db: Session, project_id: int, new_file_size: int) -> bool:
    """Verifica se o projeto tem espaço disponível para o novo arquivo"""
    current_usage = _get_project_storage_usage(db, project_id)
    max_quota_bytes = settings.PROJECT_QUOTA_MB * 1024 * 1024  # Converte MB para bytes

    return (current_usage + new_file_size) <= max_quota_bytes


def _sanitize_filename(filename: str) -> str:
    """Remove caracteres perigosos do nome do arquivo"""
    # Remove path traversal attempts
    filename = os.path.basename(filename)

    # Remove caracteres especiais mas mantém extensão
    name, ext = os.path.splitext(filename)
    name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()

    return f"{name}{ext}"


def _save_file(file: UploadFile, card_id: int) -> tuple[str, str, int]:
    """
    Salva arquivo no Cloudinary (produção) ou disco local (desenvolvimento)

    Returns:
        tuple: (file_path_or_url, mime_type, file_size)
    """
    # Gerar nome único e seguro para o arquivo
    safe_filename = _sanitize_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{safe_filename}"

    # Detectar MIME type
    mime_type = file.content_type or mimetypes.guess_type(safe_filename)[0] or "application/octet-stream"

    # Ler conteúdo do arquivo
    try:
        content = file.file.read()
        file_size = len(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao ler arquivo: {str(e)}"
        )

    # Se Cloudinary estiver configurado, usar armazenamento em nuvem
    if settings.use_cloudinary:
        try:
            folder = f"oriente/cards/{card_id}"
            result = cloudinary_service.upload_from_bytes(
                file_bytes=content,
                filename=safe_filename,
                folder=folder
            )
            # Retornar URL do Cloudinary como "file_path"
            return result["url"], mime_type, file_size
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao enviar arquivo para Cloudinary: {str(e)}"
            )

    # Caso contrário, salvar localmente (desenvolvimento)
    else:
        # Criar pasta do card se não existir
        card_dir = os.path.join(settings.UPLOAD_DIR, "cards", str(card_id))
        os.makedirs(card_dir, exist_ok=True)

        file_path = os.path.join(card_dir, unique_filename)

        # Salvar arquivo
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
    """
    Remove arquivo físico do disco (desenvolvimento)

    Em produção com Cloudinary, file_path é uma URL e não precisa ser deletado
    localmente (o arquivo está no Cloudinary)

    Nota: Para deletar do Cloudinary também, seria necessário armazenar o public_id
    no banco de dados. Por enquanto, mantemos os arquivos no Cloudinary.
    """
    # Se for uma URL do Cloudinary, não tentar deletar localmente
    if file_path.startswith("http://") or file_path.startswith("https://"):
        return True  # Arquivo está no Cloudinary, não precisa deletar localmente

    # Deletar arquivo local
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False


def upload_attachment(
    db: Session,
    card_id: int,
    project_id: int,
    file: UploadFile,
    user_id: int
) -> Attachment:
    """
    Faz upload de um anexo para um card

    Validações:
    - Usuário tem permissão de acesso ao projeto
    - Card existe e pertence ao projeto
    - Extensão do arquivo é permitida
    - Tamanho do arquivo está dentro do limite
    - Projeto não excedeu quota de armazenamento
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

    # Validar extensão do arquivo
    if not _validate_file_extension(file.filename):
        allowed = ", ".join(_get_allowed_extensions())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Extensões permitidas: {allowed}"
        )

    # Validar tamanho do arquivo (ler tamanho antes de salvar)
    file.file.seek(0, 2)  # Vai para o final do arquivo
    file_size = file.file.tell()
    file.file.seek(0)  # Volta para o início

    if not _validate_file_size(file_size):
        max_size_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo muito grande. Tamanho máximo: {max_size_mb:.1f}MB"
        )

    # Verificar quota do projeto
    if not _check_project_quota(db, project_id, file_size):
        raise HTTPException(
            status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
            detail=f"Projeto excedeu a quota de armazenamento de {settings.PROJECT_QUOTA_MB}MB"
        )

    # Salvar arquivo físico
    file_path, mime_type, actual_file_size = _save_file(file, card_id)

    # Criar registro no banco
    try:
        attachment = Attachment(
            filename=file.filename,
            file_path=file_path,
            file_size=actual_file_size,
            mime_type=mime_type,
            card_id=card_id,
            uploaded_by_id=user_id
        )

        db.add(attachment)
        db.commit()
        db.refresh(attachment)

        return attachment

    except Exception as e:
        # Se falhar ao criar registro, remover arquivo físico
        _delete_file(file_path)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar anexo no banco de dados: {str(e)}"
        )


def get_card_attachments(
    db: Session,
    card_id: int,
    project_id: int,
    user_id: int
) -> List[Attachment]:
    """
    Lista todos os anexos de um card

    Requer que o usuário tenha acesso ao projeto
    """
    # Verificar permissões
    if not ProjectService.user_can_access_project(db, project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este projeto"
        )

    # Verificar se o card pertence ao projeto
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.project_id == project_id
    ).first()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card não encontrado neste projeto"
        )

    # Buscar anexos
    attachments = db.query(Attachment).filter(
        Attachment.card_id == card_id
    ).order_by(Attachment.created_at.desc()).all()

    return attachments


def get_attachment(
    db: Session,
    attachment_id: int,
    card_id: int,
    project_id: int,
    user_id: int
) -> Optional[Attachment]:
    """
    Busca um anexo específico

    Requer que o usuário tenha acesso ao projeto
    """
    # Verificar permissões
    if not ProjectService.user_can_access_project(db, project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este projeto"
        )

    # Buscar anexo com validação de card e projeto
    attachment = db.query(Attachment).join(Card).filter(
        Attachment.id == attachment_id,
        Attachment.card_id == card_id,
        Card.project_id == project_id
    ).first()

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )

    return attachment


def delete_attachment(
    db: Session,
    attachment_id: int,
    card_id: int,
    project_id: int,
    user_id: int
) -> bool:
    """
    Deleta um anexo (arquivo físico e registro)

    Requer que o usuário tenha acesso ao projeto
    """
    # Buscar anexo com validação de permissões
    attachment = get_attachment(db, attachment_id, card_id, project_id, user_id)

    # Remover arquivo físico
    file_deleted = _delete_file(attachment.file_path)

    # Remover registro do banco (mesmo se o arquivo físico não existir)
    try:
        db.delete(attachment)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar anexo do banco de dados: {str(e)}"
        )


def get_project_storage_info(db: Session, project_id: int, user_id: int) -> dict:
    """
    Retorna informações sobre o uso de armazenamento do projeto
    """
    # Verificar permissões
    if not ProjectService.user_can_access_project(db, project_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este projeto"
        )

    used_bytes = _get_project_storage_usage(db, project_id)
    quota_bytes = settings.PROJECT_QUOTA_MB * 1024 * 1024

    return {
        "used_bytes": used_bytes,
        "used_mb": round(used_bytes / (1024 * 1024), 2),
        "quota_bytes": quota_bytes,
        "quota_mb": settings.PROJECT_QUOTA_MB,
        "available_bytes": quota_bytes - used_bytes,
        "available_mb": round((quota_bytes - used_bytes) / (1024 * 1024), 2),
        "usage_percentage": round((used_bytes / quota_bytes) * 100, 2) if quota_bytes > 0 else 0
    }
