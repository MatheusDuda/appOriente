from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.card_history import CardHistoryListResponse
from app.services.card_history_service import CardHistoryService


router = APIRouter()


@router.get(
    "/{project_id}/cards/{card_id}/history",
    response_model=CardHistoryListResponse,
    status_code=status.HTTP_200_OK,
    summary="Buscar histórico de um card",
    description="""
    Retorna o histórico completo de alterações de um card com paginação.

    O histórico inclui todas as ações realizadas no card:
    - Criação do card
    - Atualizações (título, descrição, prazo)
    - Movimentações entre colunas
    - Adição/remoção de comentários
    - Atribuição/remoção de usuários
    - Adição/remoção de tags

    **Permissões necessárias:**
    - Usuário deve ter acesso ao projeto (ser owner ou membro)

    **Parâmetros de paginação:**
    - `page`: Número da página (começa em 1)
    - `size`: Quantidade de itens por página (máximo 100)

    **Ordenação:**
    - Os eventos são retornados em ordem cronológica decrescente (mais recente primeiro)
    """
)
def get_card_history(
    project_id: int,
    card_id: int,
    page: int = Query(1, ge=1, description="Número da página (começa em 1)"),
    size: int = Query(20, ge=1, le=100, description="Quantidade de itens por página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca o histórico de alterações de um card

    Args:
        project_id: ID do projeto
        card_id: ID do card
        page: Número da página (default: 1)
        size: Itens por página (default: 20, max: 100)
        db: Sessão do banco de dados
        current_user: Usuário autenticado

    Returns:
        CardHistoryListResponse: Lista paginada de eventos do histórico

    Raises:
        HTTPException 403: Usuário sem permissão para acessar o projeto
        HTTPException 404: Card não encontrado no projeto
    """
    # Buscar histórico usando o service
    history_items, total, total_pages = CardHistoryService.get_card_history(
        db=db,
        project_id=project_id,
        card_id=card_id,
        user_id=current_user.id,
        page=page,
        size=size
    )

    # Retornar resposta paginada
    return CardHistoryListResponse(
        history=history_items,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )
