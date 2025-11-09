from sqlalchemy.orm import Session, joinedload
from typing import List, Set
from datetime import datetime, timedelta
from fastapi import HTTPException, status
import re

from app.models.comment import Comment
from app.models.comment_audit import CommentAudit
from app.models.comment_mention import CommentMention
from app.models.Card import Card
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.notification import Notification, NotificationType, RelatedEntityType
from app.models.card_history import CardHistoryAction
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.services.project_service import ProjectService
from app.services.card_history_service import CardHistoryService


class CommentService:

    # Constante: tempo limite para edição/deleção pelo autor (2 minutos)
    EDIT_TIME_LIMIT_MINUTES = 2

    @staticmethod
    def extract_mentions(content: str) -> Set[str]:
        """
        Extrair menções (@username) do conteúdo do comentário

        Formato esperado: @username ou @nome.sobrenome
        Retorna um set de usernames mencionados (sem duplicatas)

        Exemplo:
        "Olá @joao, cc @maria.silva" -> {"joao", "maria.silva"}
        """
        # Regex para capturar @username
        # Aceita letras, números, pontos, underscores e hífens após @
        mention_pattern = r'@([\w.-]+)'
        mentions = re.findall(mention_pattern, content, re.IGNORECASE)

        # Retornar set para evitar duplicatas
        return set(mentions)

    @staticmethod
    def _create_mentions(db: Session, comment: Comment, mentioned_user_ids: List[int]) -> List[CommentMention]:
        """
        Criar registros de menção no banco de dados

        Args:
            db: Sessão do banco
            comment: Comentário que contém as menções
            mentioned_user_ids: Lista de IDs dos usuários mencionados

        Returns:
            Lista de CommentMention criados
        """
        mentions = []

        for user_id in mentioned_user_ids:
            mention = CommentMention(
                comment_id=comment.id,
                mentioned_user_id=user_id
            )
            db.add(mention)
            mentions.append(mention)

        return mentions

    @staticmethod
    def _create_mention_notifications(
        db: Session,
        comment: Comment,
        mentioned_users: List[User],
        card: Card,
        author: User
    ) -> None:
        """
        Criar notificações para usuários mencionados

        Args:
            db: Sessão do banco
            comment: Comentário que contém as menções
            mentioned_users: Lista de usuários mencionados
            card: Card onde o comentário foi feito
            author: Autor do comentário
        """
        for mentioned_user in mentioned_users:
            # Não notificar o autor se ele se mencionou
            if mentioned_user.id == author.id:
                continue

            notification = Notification(
                type=NotificationType.TASK,
                title="Você foi mencionado em um comentário",
                message=f"{author.name} mencionou você no card \"{card.title}\"",
                recipient_user_id=mentioned_user.id,
                related_entity_type=RelatedEntityType.TASK,
                related_entity_id=card.id,
                action_url=f"/projects/{card.project_id}/cards/{card.id}"
            )
            db.add(notification)

    @staticmethod
    def _resolve_mentions_to_user_ids(
        db: Session,
        project_id: int,
        usernames: Set[str]
    ) -> List[int]:
        """
        Resolver usernames mencionados para IDs de usuários
        Valida se os usuários são membros do projeto

        Args:
            db: Sessão do banco
            project_id: ID do projeto
            usernames: Set de usernames mencionados

        Returns:
            Lista de IDs de usuários válidos (membros do projeto)
        """
        if not usernames:
            return []

        # Buscar projeto com membros
        project = db.query(Project).options(
            joinedload(Project.members),
            joinedload(Project.owner)
        ).filter(Project.id == project_id).first()

        if not project:
            return []

        # Criar set de todos os membros (incluindo owner)
        project_member_emails = set()

        if project.owner:
            # Extrair username do email (parte antes do @)
            owner_username = project.owner.email.split('@')[0].lower()
            project_member_emails.add((owner_username, project.owner.id))

        for member in project.members:
            member_username = member.email.split('@')[0].lower()
            project_member_emails.add((member_username, member.id))

        # Mapear usernames para IDs
        valid_user_ids = []
        for username in usernames:
            username_lower = username.lower()
            for member_username, member_id in project_member_emails:
                if member_username == username_lower:
                    valid_user_ids.append(member_id)
                    break

        return valid_user_ids

    @staticmethod
    def create_comment(db: Session, project_id: int, card_id: int, comment_data: CommentCreate, user_id: int) -> Comment:
        """
        Criar novo comentário em um card
        Qualquer membro do projeto pode criar comentários
        """

        # Verificar se usuário tem acesso ao projeto
        if not ProjectService.user_can_access_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        # Verificar se card existe e pertence ao projeto
        card = db.query(Card).filter(
            Card.id == card_id,
            Card.project_id == project_id
        ).first()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Card não encontrado neste projeto"
            )

        # Criar comentário
        comment = Comment(
            content=comment_data.content,
            card_id=card_id,
            user_id=user_id
        )

        db.add(comment)
        db.commit()
        db.refresh(comment)

        # Processar menções (@username)
        mentioned_usernames = CommentService.extract_mentions(comment_data.content)
        if mentioned_usernames:
            # Resolver usernames para IDs de usuários (apenas membros do projeto)
            mentioned_user_ids = CommentService._resolve_mentions_to_user_ids(
                db, project_id, mentioned_usernames
            )

            if mentioned_user_ids:
                # Criar registros de menção
                CommentService._create_mentions(db, comment, mentioned_user_ids)

                # Buscar usuários mencionados e autor para criar notificações
                mentioned_users = db.query(User).filter(User.id.in_(mentioned_user_ids)).all()
                author = db.query(User).filter(User.id == user_id).first()

                # Criar notificações
                CommentService._create_mention_notifications(
                    db, comment, mentioned_users, card, author
                )

        # Registrar histórico de adição de comentário
        CardHistoryService.create_history_entry(
            db=db,
            action=CardHistoryAction.COMMENT_ADDED,
            card_id=card_id,
            project_id=project_id,
            user_id=user_id,
            details={"comment_id": comment.id, "preview": comment.content[:50]}
        )
        db.commit()

        return comment

    @staticmethod
    def get_comments_by_card(db: Session, project_id: int, card_id: int, current_user_id: int) -> List[CommentResponse]:
        """
        Listar todos os comentários de um card
        Retorna com permissões (can_edit, can_delete) calculadas para cada comentário
        """

        # Verificar se usuário tem acesso ao projeto
        if not ProjectService.user_can_access_project(db, project_id, current_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        # Verificar se card existe e pertence ao projeto
        card = db.query(Card).filter(
            Card.id == card_id,
            Card.project_id == project_id
        ).first()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Card não encontrado neste projeto"
            )

        # Buscar comentários com autor e menções
        comments = db.query(Comment).filter(
            Comment.card_id == card_id
        ).options(
            joinedload(Comment.user),
            joinedload(Comment.mentions).joinedload(CommentMention.mentioned_user)
        ).order_by(Comment.created_at.asc()).all()

        # Buscar usuário atual para verificar role
        current_user = db.query(User).filter(User.id == current_user_id).first()

        # Converter para schema com permissões
        result = []
        for comment in comments:
            can_modify = CommentService._can_modify_comment(comment, current_user_id, current_user.role if current_user else UserRole.USER)

            comment_response = CommentResponse(
                id=comment.id,
                content=comment.content,
                card_id=comment.card_id,
                user_id=comment.user_id,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
                user=comment.user,
                can_edit=can_modify,
                can_delete=can_modify
            )
            result.append(comment_response)

        return result

    @staticmethod
    def update_comment(db: Session, project_id: int, card_id: int, comment_id: int,
                      comment_data: CommentUpdate, user_id: int) -> Comment:
        """
        Atualizar comentário
        Regras:
        - Autor pode editar em até 2 minutos após criação
        - ADMIN pode editar a qualquer momento
        """

        # Verificar se usuário tem acesso ao projeto
        if not ProjectService.user_can_access_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        # Buscar comentário
        comment = db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.card_id == card_id
        ).first()

        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comentário não encontrado"
            )

        # Buscar usuário para verificar role
        user = db.query(User).filter(User.id == user_id).first()

        # Verificar permissão
        if not CommentService._can_modify_comment(comment, user_id, user.role if user else UserRole.USER):
            time_passed = datetime.utcnow() - comment.created_at.replace(tzinfo=None)
            if comment.user_id == user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Comentário só pode ser editado em até {CommentService.EDIT_TIME_LIMIT_MINUTES} minutos após criação"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Apenas ADMIN pode editar comentários de outros usuários"
                )

        # Buscar card para notificações de menção
        card = db.query(Card).filter(Card.id == card_id).first()

        # Guardar IDs dos usuários já mencionados (antes da edição)
        old_mentioned_user_ids = set(mention.mentioned_user_id for mention in comment.mentions)

        # Atualizar comentário
        comment.content = comment_data.content
        comment.updated_at = datetime.utcnow()

        # Deletar menções antigas
        db.query(CommentMention).filter(CommentMention.comment_id == comment.id).delete()

        # Processar novas menções
        mentioned_usernames = CommentService.extract_mentions(comment_data.content)
        new_mentioned_user_ids = set()

        if mentioned_usernames:
            # Resolver usernames para IDs
            mentioned_user_ids = CommentService._resolve_mentions_to_user_ids(
                db, project_id, mentioned_usernames
            )

            if mentioned_user_ids:
                new_mentioned_user_ids = set(mentioned_user_ids)

                # Criar novos registros de menção
                CommentService._create_mentions(db, comment, mentioned_user_ids)

                # Notificar apenas NOVOS usuários mencionados (que não estavam antes)
                users_to_notify = new_mentioned_user_ids - old_mentioned_user_ids

                if users_to_notify:
                    mentioned_users = db.query(User).filter(User.id.in_(users_to_notify)).all()
                    author = db.query(User).filter(User.id == user_id).first()

                    CommentService._create_mention_notifications(
                        db, comment, mentioned_users, card, author
                    )

        db.commit()
        db.refresh(comment)

        return comment

    @staticmethod
    def delete_comment(db: Session, project_id: int, card_id: int, comment_id: int, user_id: int) -> None:
        """
        Deletar comentário
        Regras:
        - Autor pode deletar em até 2 minutos após criação
        - ADMIN pode deletar a qualquer momento (cria registro de auditoria)
        """

        # Verificar se usuário tem acesso ao projeto
        if not ProjectService.user_can_access_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        # Buscar comentário
        comment = db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.card_id == card_id
        ).first()

        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comentário não encontrado"
            )

        # Buscar usuário para verificar role
        user = db.query(User).filter(User.id == user_id).first()

        # Verificar permissão
        is_author = comment.user_id == user_id
        is_admin = user and user.role == UserRole.ADMIN

        if not CommentService._can_modify_comment(comment, user_id, user.role if user else UserRole.USER):
            time_passed = datetime.utcnow() - comment.created_at.replace(tzinfo=None)
            if is_author:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Comentário só pode ser deletado em até {CommentService.EDIT_TIME_LIMIT_MINUTES} minutos após criação"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Apenas ADMIN pode deletar comentários de outros usuários"
                )

        # Guardar informações do comentário antes de deletar
        comment_content_preview = comment.content[:50]
        comment_id = comment.id

        # Se ADMIN está deletando comentário de outro usuário, criar registro de auditoria
        if is_admin and not is_author:
            audit = CommentAudit(
                comment_id=comment.id,
                content=comment.content,
                original_author_id=comment.user_id,
                deleted_by_id=user_id
            )
            db.add(audit)

        # Deletar comentário
        db.delete(comment)
        db.commit()

        # Registrar histórico de remoção de comentário
        CardHistoryService.create_history_entry(
            db=db,
            action=CardHistoryAction.COMMENT_DELETED,
            card_id=card_id,
            project_id=project_id,
            user_id=user_id,
            details={"comment_id": comment_id, "preview": comment_content_preview}
        )
        db.commit()

    @staticmethod
    def _can_modify_comment(comment: Comment, user_id: int, user_role: UserRole) -> bool:
        """
        Helper: Verificar se usuário pode modificar (editar/deletar) comentário

        Retorna True se:
        - É o autor e está dentro do prazo de 2 minutos
        - É ADMIN (sem restrição de tempo)
        """

        # ADMIN sempre pode modificar
        if user_role == UserRole.ADMIN:
            return True

        # Se não é o autor, não pode modificar
        if comment.user_id != user_id:
            return False

        # Se é o autor, verificar tempo
        time_passed = datetime.utcnow() - comment.created_at.replace(tzinfo=None)
        return time_passed <= timedelta(minutes=CommentService.EDIT_TIME_LIMIT_MINUTES)
