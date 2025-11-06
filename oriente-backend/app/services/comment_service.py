from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from app.models.comment import Comment
from app.models.comment_audit import CommentAudit
from app.models.Card import Card
from app.models.user import User, UserRole
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.services.project_service import ProjectService


class CommentService:

    # Constante: tempo limite para edição/deleção pelo autor (2 minutos)
    EDIT_TIME_LIMIT_MINUTES = 2

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

        # Buscar comentários com autor
        comments = db.query(Comment).filter(
            Comment.card_id == card_id
        ).options(
            joinedload(Comment.user)
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

        # Atualizar comentário
        comment.content = comment_data.content
        comment.updated_at = datetime.utcnow()

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
