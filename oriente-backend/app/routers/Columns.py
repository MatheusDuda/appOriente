from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.Column import (
    ColumnCreate, ColumnUpdate, ColumnMove, ColumnResponse,
    ColumnListResponse
)
from app.schemas.combined import ColumnWithCards
from app.services.column_service import ColumnService

router = APIRouter()


@router.post("/{project_id}/columns", response_model=ColumnResponse, status_code=status.HTTP_201_CREATED)
def create_column(
        project_id: int,
        column_data: ColumnCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Criar nova coluna no projeto

    - **project_id**: ID do projeto
    - **title**: Título da coluna (obrigatório)
    - **description**: Descrição da coluna (opcional)
    - **color**: Cor em hexadecimal (opcional, padrão: #6366f1)
    - **position**: Posição da coluna (opcional, padrão: última)

    Permissões: Usuário deve ter permissão de edição no projeto
    """
    return ColumnService.create_column(db, project_id, column_data, current_user.id)


@router.get("/{project_id}/columns", response_model=ColumnListResponse)
def get_project_columns(
        project_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Listar todas as colunas do projeto

    - **project_id**: ID do projeto

    Retorna as colunas ordenadas por posição.
    Permissões: Usuário deve ter acesso ao projeto
    """
    columns = ColumnService.get_project_columns(db, project_id, current_user.id)
    return ColumnListResponse(columns=columns, total=len(columns))


@router.get("/{project_id}/columns/{column_id}", response_model=ColumnResponse)
def get_column(
        project_id: int,
        column_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes de uma coluna específica

    - **project_id**: ID do projeto
    - **column_id**: ID da coluna

    Permissões: Usuário deve ter acesso ao projeto
    """
    return ColumnService.get_column_by_id(db, column_id, current_user.id)


@router.get("/{project_id}/columns/{column_id}/with-cards", response_model=ColumnWithCards)
def get_column_with_cards(
        project_id: int,
        column_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Obter coluna com todas as suas tarefas

    - **project_id**: ID do projeto
    - **column_id**: ID da coluna

    Retorna a coluna com array de cards ordenados por posição.
    Permissões: Usuário deve ter acesso ao projeto
    """
    return ColumnService.get_column_by_id(db, column_id, current_user.id)


@router.put("/{project_id}/columns/{column_id}", response_model=ColumnResponse)
def update_column(
        project_id: int,
        column_id: int,
        column_data: ColumnUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Atualizar coluna

    - **project_id**: ID do projeto
    - **column_id**: ID da coluna
    - **title**: Novo título (opcional)
    - **description**: Nova descrição (opcional)
    - **color**: Nova cor (opcional)

    Permissões: Usuário deve ter permissão de edição no projeto
    """
    return ColumnService.update_column(db, column_id, column_data, current_user.id)


@router.delete("/{project_id}/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(
        project_id: int,
        column_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Deletar coluna

    - **project_id**: ID do projeto
    - **column_id**: ID da coluna

    ⚠️ **Atenção**: Não é possível deletar coluna que contém tarefas.
    Mova ou delete todas as tarefas antes de deletar a coluna.

    Permissões: Usuário deve ter permissão de edição no projeto
    """
    ColumnService.delete_column(db, column_id, current_user.id)
    return None


@router.patch("/{project_id}/columns/{column_id}/move", response_model=ColumnResponse)
def move_column(
        project_id: int,
        column_id: int,
        move_data: ColumnMove,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Mover coluna para nova posição

    - **project_id**: ID do projeto
    - **column_id**: ID da coluna a ser movida
    - **new_position**: Nova posição (começando em 0)

    As outras colunas são reordenadas automaticamente.
    Usado para implementar drag & drop de colunas.

    Permissões: Usuário deve ter permissão de edição no projeto
    """
    return ColumnService.move_column(db, column_id, move_data, current_user.id)


# === ENDPOINTS AUXILIARES ===

@router.get("/{project_id}/columns-summary")
def get_columns_summary(
        project_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Resumo rápido das colunas com contagem de tarefas

    Útil para dashboards e visões gerais.
    """
    columns = ColumnService.get_project_columns(db, project_id, current_user.id)

    summary = []
    for column in columns:
        summary.append({
            "id": column.id,
            "title": column.title,
            "color": column.color,
            "position": column.position,
            "card_count": len(column.cards)
        })

    return {"columns": summary, "total": len(columns)}