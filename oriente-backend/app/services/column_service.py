from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from fastapi import HTTPException, status

from app.models.Column import KanbanColumn
from app.models.project import Project
from app.schemas.Column import ColumnCreate, ColumnUpdate, ColumnMove
from app.services.project_service import ProjectService


class ColumnService:

    @staticmethod
    def create_column(db: Session, project_id: int, column_data: ColumnCreate, user_id: int) -> KanbanColumn:
        """Criar nova coluna no projeto"""

        # Verificar se usuário tem permissão no projeto
        if not ProjectService.user_can_edit_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para editar este projeto"
            )

        # Verificar se projeto existe
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )

        # Calcular posição se não informada
        if column_data.position is None:
            max_position = db.query(KanbanColumn).filter(
                KanbanColumn.project_id == project_id
            ).count()
            position = max_position
        else:
            position = column_data.position
            # Ajustar posições das outras colunas
            ColumnService._adjust_positions_on_insert(db, project_id, position)

        # Criar coluna
        column = KanbanColumn(
            title=column_data.title,
            description=column_data.description,
            color=column_data.color,
            position=position,
            project_id=project_id
        )

        db.add(column)
        db.commit()
        db.refresh(column)

        return column

    @staticmethod
    def get_project_columns(db: Session, project_id: int, user_id: int) -> List[KanbanColumn]:
        """Buscar todas as colunas de um projeto"""

        # Verificar se usuário tem acesso ao projeto
        if not ProjectService.user_can_access_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        columns = db.query(KanbanColumn).filter(
            KanbanColumn.project_id == project_id
        ).order_by(KanbanColumn.position).all()

        return columns

    @staticmethod
    def get_column_by_id(db: Session, column_id: int, user_id: int) -> KanbanColumn:
        """Buscar coluna por ID"""

        column = db.query(KanbanColumn).filter(KanbanColumn.id == column_id).first()
        if not column:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coluna não encontrada"
            )

        # Verificar se usuário tem acesso ao projeto
        if not ProjectService.user_can_access_project(db, column.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar esta coluna"
            )

        return column

    @staticmethod
    def update_column(db: Session, column_id: int, column_data: ColumnUpdate, user_id: int) -> KanbanColumn:
        """Atualizar coluna"""

        column = ColumnService.get_column_by_id(db, column_id, user_id)

        # Verificar permissão de edição
        if not ProjectService.user_can_edit_project(db, column.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para editar esta coluna"
            )

        # Atualizar campos
        update_data = column_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(column, field, value)

        db.commit()
        db.refresh(column)

        return column

    @staticmethod
    def delete_column(db: Session, column_id: int, user_id: int) -> bool:
        """Deletar coluna"""

        column = ColumnService.get_column_by_id(db, column_id, user_id)

        # Verificar permissão de edição
        if not ProjectService.user_can_edit_project(db, column.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para deletar esta coluna"
            )

        # Verificar se coluna tem cards
        if column.cards:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível deletar coluna que contém tarefas"
            )

        project_id = column.project_id
        position = column.position

        # Deletar coluna
        db.delete(column)

        # Ajustar posições das outras colunas
        ColumnService._adjust_positions_on_delete(db, project_id, position)

        db.commit()
        return True

    @staticmethod
    def move_column(db: Session, column_id: int, move_data: ColumnMove, user_id: int) -> KanbanColumn:
        """Mover coluna para nova posição"""

        column = ColumnService.get_column_by_id(db, column_id, user_id)

        # Verificar permissão de edição
        if not ProjectService.user_can_edit_project(db, column.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para mover esta coluna"
            )

        old_position = column.position
        new_position = move_data.new_position

        if old_position == new_position:
            return column  # Sem mudança

        # Reordenar colunas
        ColumnService._reorder_columns(db, column.project_id, old_position, new_position)

        # Atualizar posição da coluna
        column.position = new_position
        db.commit()
        db.refresh(column)

        return column

    @staticmethod
    def create_default_columns(db: Session, project_id: int) -> List[KanbanColumn]:
        """Criar colunas padrão para novo projeto"""

        default_columns = [
            {"title": "A Fazer", "color": "#ef4444", "position": 0},
            {"title": "Em Progresso", "color": "#f59e0b", "position": 1},
            {"title": "Concluído", "color": "#10b981", "position": 2}
        ]

        created_columns = []
        for col_data in default_columns:
            column = KanbanColumn(
                title=col_data["title"],
                color=col_data["color"],
                position=col_data["position"],
                project_id=project_id
            )
            db.add(column)
            created_columns.append(column)

        db.commit()

        for column in created_columns:
            db.refresh(column)

        return created_columns

    # === MÉTODOS AUXILIARES ===

    @staticmethod
    def _adjust_positions_on_insert(db: Session, project_id: int, insert_position: int):
        """Ajustar posições quando inserir nova coluna"""

        columns_to_update = db.query(KanbanColumn).filter(
            and_(
                KanbanColumn.project_id == project_id,
                KanbanColumn.position >= insert_position
            )
        ).all()

        for column in columns_to_update:
            column.position += 1

    @staticmethod
    def _adjust_positions_on_delete(db: Session, project_id: int, deleted_position: int):
        """Ajustar posições quando deletar coluna"""

        columns_to_update = db.query(KanbanColumn).filter(
            and_(
                KanbanColumn.project_id == project_id,
                KanbanColumn.position > deleted_position
            )
        ).all()

        for column in columns_to_update:
            column.position -= 1

    @staticmethod
    def _reorder_columns(db: Session, project_id: int, old_position: int, new_position: int):
        """Reordenar colunas quando mover uma"""

        if old_position < new_position:
            # Mover para frente: diminuir posição das colunas intermediárias
            columns_to_update = db.query(KanbanColumn).filter(
                and_(
                    KanbanColumn.project_id == project_id,
                    KanbanColumn.position > old_position,
                    KanbanColumn.position <= new_position
                )
            ).all()

            for column in columns_to_update:
                column.position -= 1

        else:
            # Mover para trás: aumentar posição das colunas intermediárias
            columns_to_update = db.query(KanbanColumn).filter(
                and_(
                    KanbanColumn.project_id == project_id,
                    KanbanColumn.position >= new_position,
                    KanbanColumn.position < old_position
                )
            ).all()

            for column in columns_to_update:
                column.position += 1

