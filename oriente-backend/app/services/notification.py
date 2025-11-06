from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, or_
from typing import List, Optional
from fastapi import HTTPException, status

from app.models.notification import Notification, NotificationType, RelatedEntityType
from app.models.user import User, UserRole
from app.schemas.notification import (
    NotificationCreateRequest,
    NotificationStatsResponse,
    NotificationMarkReadRequest
)


class NotificationService:

    @staticmethod
    def create_notification(
        db: Session,
        notification_data: NotificationCreateRequest,
        current_user_id: int
    ) -> Notification:
        """
        Criar nova notificação
        - ADMINs podem criar notificações para qualquer usuário
        - Usuários normais só podem criar notificações para si mesmos
        """

        # Verificar se usuário existe
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Determinar destinatário
        recipient_id = notification_data.recipient_user_id

        # Se não especificou destinatário, usa o próprio usuário
        if recipient_id is None:
            recipient_id = current_user_id
        # Se especificou destinatário diferente, apenas ADMIN pode fazer isso
        elif recipient_id != current_user_id:
            if current_user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Apenas administradores podem criar notificações para outros usuários"
                )

        # Verificar se destinatário existe
        recipient = db.query(User).filter(User.id == recipient_id).first()
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Destinatário não encontrado"
            )

        # Criar notificação
        notification = Notification(
            type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
            recipient_user_id=recipient_id,
            related_entity_type=notification_data.related_entity_type,
            related_entity_id=notification_data.related_entity_id,
            action_url=notification_data.action_url
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return notification

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        unread_only: bool = False,
        notification_type: Optional[NotificationType] = None,
        limit: Optional[int] = None
    ) -> List[Notification]:
        """
        Buscar notificações do usuário com filtros opcionais
        """

        query = db.query(Notification).options(
            joinedload(Notification.recipient)
        ).filter(Notification.recipient_user_id == user_id)

        # Filtro: apenas não lidas
        if unread_only:
            query = query.filter(Notification.is_read == False)

        # Filtro: por tipo
        if notification_type:
            query = query.filter(Notification.type == notification_type)

        # Ordenar por mais recentes primeiro
        query = query.order_by(Notification.created_at.desc())

        # Limite de resultados
        if limit:
            query = query.limit(limit)

        notifications = query.all()
        return notifications

    @staticmethod
    def get_notification_by_id(
        db: Session,
        notification_id: int,
        current_user_id: int
    ) -> Notification:
        """
        Buscar notificação por ID
        Usuário só pode ver suas próprias notificações (exceto ADMIN)
        """

        notification = db.query(Notification).options(
            joinedload(Notification.recipient)
        ).filter(Notification.id == notification_id).first()

        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notificação não encontrada"
            )

        # Verificar permissão
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if notification.recipient_user_id != current_user_id and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar esta notificação"
            )

        return notification

    @staticmethod
    def mark_as_read(
        db: Session,
        notification_id: int,
        current_user_id: int
    ) -> Notification:
        """Marcar notificação como lida"""

        notification = NotificationService.get_notification_by_id(
            db, notification_id, current_user_id
        )

        if notification.is_read:
            # Já está marcada como lida, retornar sem alteração
            return notification

        notification.is_read = True
        db.commit()
        db.refresh(notification)

        return notification

    @staticmethod
    def mark_multiple_as_read(
        db: Session,
        request: NotificationMarkReadRequest,
        current_user_id: int
    ) -> int:
        """
        Marcar múltiplas notificações como lidas
        Retorna quantidade de notificações marcadas
        """

        # Buscar notificações do usuário que não estão lidas
        notifications = db.query(Notification).filter(
            and_(
                Notification.id.in_(request.notification_ids),
                Notification.recipient_user_id == current_user_id,
                Notification.is_read == False
            )
        ).all()

        if not notifications:
            return 0

        # Marcar todas como lidas
        count = 0
        for notification in notifications:
            notification.is_read = True
            count += 1

        db.commit()
        return count

    @staticmethod
    def mark_all_as_read(db: Session, current_user_id: int) -> int:
        """
        Marcar todas as notificações do usuário como lidas
        Retorna quantidade de notificações marcadas
        """

        # Buscar todas as notificações não lidas do usuário
        notifications = db.query(Notification).filter(
            and_(
                Notification.recipient_user_id == current_user_id,
                Notification.is_read == False
            )
        ).all()

        if not notifications:
            return 0

        # Marcar todas como lidas
        count = 0
        for notification in notifications:
            notification.is_read = True
            count += 1

        db.commit()
        return count

    @staticmethod
    def delete_notification(
        db: Session,
        notification_id: int,
        current_user_id: int
    ) -> None:
        """Deletar notificação (usuário só pode deletar suas próprias)"""

        notification = NotificationService.get_notification_by_id(
            db, notification_id, current_user_id
        )

        # Verificar se é o dono (apenas para ter certeza, get_notification_by_id já valida)
        if notification.recipient_user_id != current_user_id:
            current_user = db.query(User).filter(User.id == current_user_id).first()
            if current_user.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Você não pode deletar esta notificação"
                )

        db.delete(notification)
        db.commit()

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Obter contagem de notificações não lidas do usuário"""

        count = db.query(func.count(Notification.id)).filter(
            and_(
                Notification.recipient_user_id == user_id,
                Notification.is_read == False
            )
        ).scalar()

        return count or 0

    @staticmethod
    def get_notification_stats(db: Session, user_id: int) -> NotificationStatsResponse:
        """Obter estatísticas completas de notificações do usuário"""

        # Total de notificações
        total = db.query(func.count(Notification.id)).filter(
            Notification.recipient_user_id == user_id
        ).scalar() or 0

        # Não lidas
        unread_count = NotificationService.get_unread_count(db, user_id)

        # Lidas
        read_count = total - unread_count

        # Por tipo
        by_type_raw = db.query(
            Notification.type,
            func.count(Notification.id)
        ).filter(
            Notification.recipient_user_id == user_id
        ).group_by(Notification.type).all()

        by_type = {str(type_): count for type_, count in by_type_raw}

        return NotificationStatsResponse(
            total=total,
            unread_count=unread_count,
            read_count=read_count,
            by_type=by_type
        )

    @staticmethod
    def delete_all_read_notifications(db: Session, user_id: int) -> int:
        """
        Deletar todas as notificações lidas do usuário
        Útil para limpar notificações antigas
        Retorna quantidade de notificações deletadas
        """

        notifications = db.query(Notification).filter(
            and_(
                Notification.recipient_user_id == user_id,
                Notification.is_read == True
            )
        ).all()

        count = len(notifications)

        for notification in notifications:
            db.delete(notification)

        db.commit()
        return count
