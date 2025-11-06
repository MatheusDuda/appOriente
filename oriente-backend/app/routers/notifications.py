from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import NotificationType
from app.schemas.notification import (
    NotificationCreateRequest,
    NotificationResponse,
    NotificationSummaryResponse,
    NotificationListResponse,
    NotificationStatsResponse,
    NotificationMarkReadRequest,
    NotificationMarkReadResponse
)
from app.services.notification import NotificationService

router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"]
)


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    request: NotificationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar nova notificação

    - Usuários normais só podem criar notificações para si mesmos
    - ADMINs podem criar notificações para qualquer usuário
    - Se recipient_user_id não for especificado, usa o usuário atual
    """
    try:
        notification = NotificationService.create_notification(db, request, current_user.id)
        return NotificationResponse.model_validate(notification)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    unread_only: bool = Query(False, description="Filtrar apenas não lidas"),
    notification_type: Optional[NotificationType] = Query(None, description="Filtrar por tipo"),
    limit: Optional[int] = Query(None, description="Limitar quantidade de resultados"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar notificações do usuário atual

    - Retorna todas as notificações do usuário
    - Pode filtrar por: não lidas, tipo
    - Pode limitar quantidade de resultados
    - Ordenadas por mais recentes primeiro
    """
    try:
        notifications = NotificationService.get_user_notifications(
            db,
            current_user.id,
            unread_only=unread_only,
            notification_type=notification_type,
            limit=limit
        )

        # Calcular total de não lidas (para o badge)
        unread_count = NotificationService.get_unread_count(db, current_user.id)

        return NotificationListResponse(
            notifications=[NotificationResponse.model_validate(n) for n in notifications],
            total=len(notifications),
            unread_count=unread_count
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/count", response_model=dict)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter contagem de notificações não lidas

    - Útil para exibir badge no ícone de notificações
    """
    try:
        count = NotificationService.get_unread_count(db, current_user.id)
        return {"unread_count": count}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/stats", response_model=NotificationStatsResponse)
def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter estatísticas de notificações do usuário

    - Total de notificações
    - Quantidade de lidas e não lidas
    - Contagem por tipo (TASK, TEAM, SYSTEM)
    """
    try:
        stats = NotificationService.get_notification_stats(db, current_user.id)
        return stats
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Buscar notificação por ID

    - Usuário só pode ver suas próprias notificações
    - ADMIN pode ver qualquer notificação
    """
    try:
        notification = NotificationService.get_notification_by_id(
            db, notification_id, current_user.id
        )
        return NotificationResponse.model_validate(notification)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marcar notificação como lida

    - Marca uma notificação específica como lida
    - Usuário só pode marcar suas próprias notificações
    """
    try:
        notification = NotificationService.mark_as_read(
            db, notification_id, current_user.id
        )
        return NotificationResponse.model_validate(notification)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/read", response_model=NotificationMarkReadResponse)
def mark_multiple_notifications_as_read(
    request: NotificationMarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marcar múltiplas notificações como lidas

    - Marca várias notificações de uma vez
    - Útil para marcar seleção de notificações
    - Ignora notificações já lidas
    """
    try:
        marked_count = NotificationService.mark_multiple_as_read(
            db, request, current_user.id
        )
        return NotificationMarkReadResponse(
            message=f"{marked_count} notificação(ões) marcada(s) como lida(s)",
            marked_count=marked_count,
            notification_ids=request.notification_ids
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/read-all", response_model=dict)
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marcar todas as notificações como lidas

    - Marca todas as notificações não lidas do usuário
    - Útil para botão "Marcar todas como lidas"
    """
    try:
        marked_count = NotificationService.mark_all_as_read(db, current_user.id)
        return {
            "message": f"{marked_count} notificação(ões) marcada(s) como lida(s)",
            "marked_count": marked_count
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletar notificação

    - Usuário só pode deletar suas próprias notificações
    - ADMIN pode deletar qualquer notificação
    """
    try:
        NotificationService.delete_notification(db, notification_id, current_user.id)
        return None
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/read/all", response_model=dict)
def delete_all_read_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletar todas as notificações lidas

    - Remove todas as notificações já lidas do usuário
    - Útil para limpar notificações antigas
    """
    try:
        deleted_count = NotificationService.delete_all_read_notifications(
            db, current_user.id
        )
        return {
            "message": f"{deleted_count} notificação(ões) deletada(s)",
            "deleted_count": deleted_count
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
