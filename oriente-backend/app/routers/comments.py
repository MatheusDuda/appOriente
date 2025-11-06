from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.services.comment_service import CommentService

router = APIRouter()


@router.post("/{project_id}/cards/{card_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
        project_id: int,
        card_id: int,
        comment_data: CommentCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Criar novo comentário em um card

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **content**: Conteúdo do comentário (suporta Markdown básico)

    Permissões: Qualquer membro do projeto pode criar comentários
    """
    comment = CommentService.create_comment(db, project_id, card_id, comment_data, current_user.id)

    # Recarregar com relacionamentos para retornar CommentResponse completo
    db.refresh(comment)

    # Calcular permissões
    can_modify = CommentService._can_modify_comment(comment, current_user.id, current_user.role)

    return CommentResponse(
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


@router.get("/{project_id}/cards/{card_id}/comments", response_model=List[CommentResponse])
def get_card_comments(
        project_id: int,
        card_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Listar todos os comentários de um card

    - **project_id**: ID do projeto
    - **card_id**: ID do card

    Permissões: Qualquer membro do projeto pode visualizar comentários

    Retorna comentários com flags `can_edit` e `can_delete` calculadas para o usuário atual:
    - Autor pode editar/deletar em até 2 minutos após criação
    - ADMIN pode editar/deletar a qualquer momento
    """
    return CommentService.get_comments_by_card(db, project_id, card_id, current_user.id)


@router.put("/{project_id}/cards/{card_id}/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
        project_id: int,
        card_id: int,
        comment_id: int,
        comment_data: CommentUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Atualizar comentário

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **comment_id**: ID do comentário
    - **content**: Novo conteúdo do comentário

    Permissões:
    - Autor pode editar em até 2 minutos após criação
    - ADMIN pode editar a qualquer momento
    """
    comment = CommentService.update_comment(db, project_id, card_id, comment_id, comment_data, current_user.id)

    # Recarregar com relacionamentos
    db.refresh(comment)

    # Calcular permissões
    can_modify = CommentService._can_modify_comment(comment, current_user.id, current_user.role)

    return CommentResponse(
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


@router.delete("/{project_id}/cards/{card_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
        project_id: int,
        card_id: int,
        comment_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Deletar comentário

    - **project_id**: ID do projeto
    - **card_id**: ID do card
    - **comment_id**: ID do comentário

    Permissões:
    - Autor pode deletar em até 2 minutos após criação
    - ADMIN pode deletar a qualquer momento (cria registro de auditoria)

    Retorna: 204 No Content
    """
    CommentService.delete_comment(db, project_id, card_id, comment_id, current_user.id)
    return None
