from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.Card import (
    CardCreate, CardUpdate, CardMove, CardStatusUpdate, CardResponse,
    CardListResponse, CardWithColumn, CardFilters, CardPriorityEnum,
    CardStatusEnum
)
from app.services.card_service import CardService

router = APIRouter()


@router.post("/{project_id}/cards", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
        project_id: int,
        card_data: CardCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Criar nova tarefa no projeto

    - **project_id**: ID do projeto
    - **column_id**: ID da coluna onde criar a tarefa
    - **title**: Título da tarefa (obrigatório)
    - **description**: Descrição detalhada (opcional)
    - **priority**: Prioridade (low, medium, high, urgent)
    - **due_date**: Data de vencimento (opcional)
    - **position**: Posição na coluna (opcional, padrão: última)
    - **assignee_ids**: IDs dos usuários atribuídos (opcional)

    Permissões: Usuário deve ter permissão de edição no projeto
    """
    return CardService.create_card(db, project_id, card_data, current_user.id)


@router.get("/{project_id}/cards", response_model=CardListResponse)
def get_project_cards(
        project_id: int,
        # Filtros opcionais
        status: Optional[CardStatusEnum] = Query(None, description="Filtrar por status"),
        priority: Optional[CardPriorityEnum] = Query(None, description="Filtrar por prioridade"),
        column_id: Optional[int] = Query(None, description="Filtrar por coluna"),
        assignee_id: Optional[int] = Query(None, description="Filtrar por usuário atribuído"),
        due_soon: Optional[bool] = Query(None, description="Tarefas com vencimento próximo"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Listar todas as tarefas do projeto com filtros

    - **project_id**: ID do projeto

    **Filtros disponíveis:**
    - **status**: active, archived, deleted
    - **priority**: low, medium, high, urgent
    - **column_id**: ID da coluna específica
    - **assignee_id**: ID do usuário atribuído
    - **due_soon**: true para tarefas vencendo em 7 dias

    Retorna as tarefas ordenadas por coluna e posição.
    Permissões: Usuário deve ter acesso ao projeto
    """
    filters = CardFilters(
        status=status,
        priority=priority,
        column_id=column_id,
        assignee_id=assignee_id,
        due_soon=due_soon
    )

    cards = CardService.get_project_cards(db, project_id, current_user.id, filters)
    return CardListResponse(cards=cards, total=len(cards))


@router.get("/{project_id}/cards/{card_id}", response_model=CardResponse)
def get_card(
        project_id: int,
        card_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes de uma tarefa específica

    - **project_id**: ID do projeto
    - **card_id**: ID da tarefa

    Inclui assignees, criador e dados da coluna.
    Permissões: Usuário deve ter acesso ao projeto
    """
    return CardService.get_card_by_id(db, card_id, current_user.id)


@router.put("/{project_id}/cards/{card_id}", response_model=CardResponse)
def update_card(
        project_id: int,
        card_id: int,
        card_data: CardUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Atualizar tarefa

    - **project_id**: ID do projeto
    - **card_id**: ID da tarefa
    - **title**: Novo título (opcional)
    - **description**: Nova descrição (opcional)
    - **priority**: Nova prioridade (opcional)
    - **due_date**: Nova data de vencimento (opcional)
    - **assignee_ids**: Novos usuários atribuídos (opcional, substitui todos)

    Permissões: Usuário deve ter permissão de edição no projeto
    """
    return CardService.update_card(db, card_id, card_data, current_user.id)


@router.delete("/{project_id}/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
        project_id: int,
        card_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Deletar tarefa

    - **project_id**: ID do projeto
    - **card_id**: ID da tarefa

    Remove a tarefa e reordena automaticamente as outras na coluna.
    Permissões: Usuário deve ter permissão de edição no projeto
    """
    CardService.delete_card(db, card_id, current_user.id)
    return None


@router.patch("/{project_id}/cards/{card_id}/move", response_model=CardResponse)
def move_card(
        project_id: int,
        card_id: int,
        move_data: CardMove,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Mover tarefa para outra coluna/posição

    - **project_id**: ID do projeto
    - **card_id**: ID da tarefa a ser movida
    - **column_id**: ID da coluna de destino
    - **new_position**: Nova posição na coluna de destino

    Usado para implementar drag & drop de tarefas.
    As outras tarefas são reordenadas automaticamente.
    Se mover para coluna "Concluído", marca data de conclusão.

    Permissões: Usuário deve ter permissão de edição no projeto
    """
    return CardService.move_card(db, card_id, move_data, current_user.id)


@router.patch("/{project_id}/cards/{card_id}/status", response_model=CardResponse)
def update_card_status(
        project_id: int,
        card_id: int,
        status_data: CardStatusUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Atualizar status da tarefa

    - **project_id**: ID do projeto
    - **card_id**: ID da tarefa
    - **status**: Novo status (active, archived, deleted)

    Útil para arquivar ou restaurar tarefas sem mover entre colunas.
    Permissões: Usuário deve ter permissão de edição no projeto
    """
    return CardService.update_card_status(db, card_id, status_data, current_user.id)


# === ENDPOINTS AUXILIARES ===

@router.get("/{project_id}/cards/my-assignments", response_model=CardListResponse)
def get_my_assigned_cards(
        project_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Listar tarefas atribuídas ao usuário atual

    Útil para "Minhas Tarefas" ou dashboards pessoais.
    """
    filters = CardFilters(assignee_id=current_user.id, status=CardStatusEnum.ACTIVE)
    cards = CardService.get_project_cards(db, project_id, current_user.id, filters)
    return CardListResponse(cards=cards, total=len(cards))


@router.get("/{project_id}/cards/due-soon", response_model=CardListResponse)
def get_cards_due_soon(
        project_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Listar tarefas com vencimento próximo (7 dias)

    Útil para alertas e notificações.
    """
    filters = CardFilters(due_soon=True, status=CardStatusEnum.ACTIVE)
    cards = CardService.get_project_cards(db, project_id, current_user.id, filters)
    return CardListResponse(cards=cards, total=len(cards))


@router.get("/{project_id}/board")
def get_board_view(
        project_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Visão completa do board Kanban

    Retorna todas as colunas com suas respectivas tarefas.
    Estrutura otimizada para renderizar o board completo.
    """
    from app.services.column_service import ColumnService

    columns = ColumnService.get_project_columns(db, project_id, current_user.id)

    board = []
    for column in columns:
        column_data = {
            "id": column.id,
            "title": column.title,
            "color": column.color,
            "position": column.position,
            "cards": [
                {
                    "id": card.id,
                    "title": card.title,
                    "description": card.description,
                    "priority": card.priority,
                    "position": card.position,
                    "due_date": card.due_date,
                    "assignees": [{"id": u.id, "name": u.name} for u in card.assignees]
                }
                for card in column.cards
                if card.status == CardStatusEnum.ACTIVE
            ]
        }
        board.append(column_data)

    return {"board": board, "total_columns": len(board)}