import os
import uuid
from typing import List
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
import mimetypes

from app.models.chat_message_attachment import ChatMessageAttachment
from app.models.chat_message import ChatMessage
from app.models.chat import Chat
from app.core.config import settings
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


def _save_file(file: UploadFile, message_id: int) -> tuple[str, str, int]:
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
            folder = f"oriente/chat_messages/{message_id}"
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
        message_dir = os.path.join(settings.UPLOAD_DIR, "chat_messages", str(message_id))
        os.makedirs(message_dir, exist_ok=True)
        file_path = os.path.join(message_dir, unique_filename)

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


def _user_is_chat_participant(db: Session, chat_id: int, user_id: int) -> bool:
    """Verifica se o usuário é participante do chat"""
    from app.models.chat import chat_participants
    from sqlalchemy import select

    stmt = select(chat_participants).where(
        chat_participants.c.chat_id == chat_id,
        chat_participants.c.user_id == user_id
    )
    result = db.execute(stmt).first()
    return result is not None


def upload_message_attachment(
    db: Session,
    chat_id: int,
    message_id: int,
    file: UploadFile,
    user_id: int
) -> ChatMessageAttachment:
    """
    Faz upload de um anexo para uma mensagem de chat

    Validações:
    - Usuário é participante do chat
    - Mensagem existe e pertence ao chat
    - Extensão do arquivo é permitida
    - Tamanho do arquivo está dentro do limite
    """
    # Verificar se usuário é participante do chat
    if not _user_is_chat_participant(db, chat_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este chat"
        )

    # Verificar se a mensagem existe e pertence ao chat
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.chat_id == chat_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mensagem não encontrada neste chat"
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
    file_path, mime_type, actual_file_size = _save_file(file, message_id)

    # Criar registro no banco
    try:
        attachment = ChatMessageAttachment(
            filename=file.filename,
            file_path=file_path,
            file_size=actual_file_size,
            mime_type=mime_type,
            message_id=message_id,
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


def get_message_attachments(
    db: Session,
    chat_id: int,
    message_id: int,
    user_id: int
) -> List[ChatMessageAttachment]:
    """Retorna todos os anexos de uma mensagem"""
    # Verificar permissões
    if not _user_is_chat_participant(db, chat_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este chat"
        )

    # Verificar se a mensagem existe
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.chat_id == chat_id
    ).first()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mensagem não encontrada"
        )

    attachments = db.query(ChatMessageAttachment).filter(
        ChatMessageAttachment.message_id == message_id
    ).all()

    return attachments


def get_message_attachment(
    db: Session,
    chat_id: int,
    message_id: int,
    attachment_id: int,
    user_id: int
) -> ChatMessageAttachment:
    """Retorna um anexo específico"""
    if not _user_is_chat_participant(db, chat_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este chat"
        )

    attachment = db.query(ChatMessageAttachment).join(ChatMessage).filter(
        ChatMessageAttachment.id == attachment_id,
        ChatMessageAttachment.message_id == message_id,
        ChatMessage.chat_id == chat_id
    ).first()

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado"
        )

    return attachment


def delete_message_attachment(
    db: Session,
    chat_id: int,
    message_id: int,
    attachment_id: int,
    user_id: int
) -> bool:
    """Deleta um anexo"""
    if not _user_is_chat_participant(db, chat_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este chat"
        )

    attachment = db.query(ChatMessageAttachment).join(ChatMessage).filter(
        ChatMessageAttachment.id == attachment_id,
        ChatMessageAttachment.message_id == message_id,
        ChatMessage.chat_id == chat_id
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
