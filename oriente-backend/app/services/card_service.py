from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from app.models.Card import Card, CardStatus, CardPriority
from app.models.Column import KanbanColumn
from app.models.user import User
from app.models.project import Project
from app.models.card_history import CardHistoryAction
from app.schemas.Card import (
    CardCreate, CardUpdate, CardMove, CardStatusUpdate,
    CardFilters
)
from app.services.project_service import ProjectService
from app.services.card_history_service import CardHistoryService


class CardService:

    @staticmethod
    def create_card(db: Session, project_id: int, card_data: CardCreate, user_id: int) -> Card:
        """Criar nova tarefa"""

        # Verificar se usuário tem permissão no projeto
        if not ProjectService.user_can_edit_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para criar tarefas neste projeto"
            )

        # Verificar se coluna existe e pertence ao projeto
        column = db.query(KanbanColumn).filter(
            and_(
                KanbanColumn.id == card_data.column_id,
                KanbanColumn.project_id == project_id
            )
        ).first()

        if not column:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coluna não encontrada neste projeto"
            )

        # Calcular posição se não informada
        if card_data.position is None:
            max_position = db.query(Card).filter(
                Card.column_id == card_data.column_id
            ).count()
            position = max_position
        else:
            position = card_data.position
            # Ajustar posições dos outros cards
            CardService._adjust_positions_on_insert(db, card_data.column_id, position)

        # Criar card
        card = Card(
            title=card_data.title,
            description=card_data.description,
            priority=card_data.priority,
            due_date=card_data.due_date,
            position=position,
            column_id=card_data.column_id,
            project_id=project_id,
            created_by_id=user_id
        )

        db.add(card)
        db.flush()  # Para obter o ID do card

        # Adicionar assignees
        if card_data.assignee_ids:
            CardService._add_assignees(db, card, card_data.assignee_ids, project_id)

        db.commit()
        db.refresh(card)

        # Registrar histórico de criação
        CardHistoryService.create_history_entry(
            db=db,
            action=CardHistoryAction.CREATED,
            card_id=card.id,
            project_id=project_id,
            user_id=user_id,
            details={"title": card.title}
        )
        db.commit()

        return card

    @staticmethod
    def get_project_cards(
            db: Session,
            project_id: int,
            user_id: int,
            filters: Optional[CardFilters] = None
    ) -> List[Card]:
        """Buscar todas as tarefas de um projeto com filtros"""

        # Verificar se usuário tem acesso ao projeto
        if not ProjectService.user_can_access_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        query = db.query(Card).options(
            joinedload(Card.assignees),
            joinedload(Card.created_by),
            joinedload(Card.column)
        ).filter(Card.project_id == project_id)

        # Aplicar filtros
        if filters:
            if filters.status:
                query = query.filter(Card.status == filters.status)

            if filters.priority:
                query = query.filter(Card.priority == filters.priority)

            if filters.column_id:
                query = query.filter(Card.column_id == filters.column_id)

            if filters.assignee_id:
                query = query.join(Card.assignees).filter(User.id == filters.assignee_id)

            if filters.due_soon:
                # Tarefas com vencimento nos próximos 7 dias
                week_from_now = datetime.utcnow() + timedelta(days=7)
                query = query.filter(
                    and_(
                        Card.due_date.isnot(None),
                        Card.due_date <= week_from_now
                    )
                )

        # Ordenar por coluna e posição
        cards = query.join(KanbanColumn).order_by(
            KanbanColumn.position,
            Card.position
        ).all()

        return cards

    @staticmethod
    def get_card_by_id(db: Session, card_id: int, user_id: int) -> Card:
        """Buscar tarefa por ID"""

        card = db.query(Card).options(
            joinedload(Card.assignees),
            joinedload(Card.created_by),
            joinedload(Card.column)
        ).filter(Card.id == card_id).first()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarefa não encontrada"
            )

        # Verificar se usuário tem acesso ao projeto
        if not ProjectService.user_can_access_project(db, card.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar esta tarefa"
            )

        return card

    @staticmethod
    def update_card(db: Session, card_id: int, card_data: CardUpdate, user_id: int) -> Card:
        """Atualizar tarefa"""

        card = CardService.get_card_by_id(db, card_id, user_id)

        # Verificar permissão de edição
        if not ProjectService.user_can_edit_project(db, card.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para editar esta tarefa"
            )

        # Rastrear mudanças para histórico
        changes = {}
        old_title = card.title
        old_description = card.description
        old_due_date = card.due_date
        old_assignee_ids = {u.id for u in card.assignees}

        # Atualizar campos básicos
        update_data = card_data.model_dump(exclude_unset=True, exclude={'assignee_ids'})
        for field, value in update_data.items():
            setattr(card, field, value)

        # Detectar mudanças
        if 'title' in update_data and old_title != card.title:
            changes['title_changed'] = True
            changes['old_title'] = old_title
            changes['new_title'] = card.title

        if 'description' in update_data and old_description != card.description:
            changes['description_changed'] = True

        if 'due_date' in update_data and old_due_date != card.due_date:
            changes['deadline_changed'] = True

        # Atualizar assignees se informado
        assignees_changed = False
        if card_data.assignee_ids is not None:
            new_assignee_ids = set(card_data.assignee_ids) if card_data.assignee_ids else set()

            # Detectar quem foi adicionado e removido
            added_assignees = new_assignee_ids - old_assignee_ids
            removed_assignees = old_assignee_ids - new_assignee_ids

            # Remover assignees atuais
            card.assignees.clear()
            # Adicionar novos assignees
            if card_data.assignee_ids:
                CardService._add_assignees(db, card, card_data.assignee_ids, card.project_id)

            assignees_changed = bool(added_assignees or removed_assignees)

        db.commit()
        db.refresh(card)

        # Registrar histórico se houve mudanças nos campos básicos
        if changes:
            CardHistoryService.create_history_entry(
                db=db,
                action=CardHistoryAction.UPDATED,
                card_id=card.id,
                project_id=card.project_id,
                user_id=user_id,
                details=changes
            )
            db.commit()

        # Registrar mudanças de assignees (individualmente)
        if card_data.assignee_ids is not None:
            new_assignee_ids = set(card_data.assignee_ids) if card_data.assignee_ids else set()
            added_assignees = new_assignee_ids - old_assignee_ids
            removed_assignees = old_assignee_ids - new_assignee_ids

            # Criar histórico para cada assignee adicionado
            for assignee_id in added_assignees:
                user = db.query(User).filter(User.id == assignee_id).first()
                if user:
                    CardHistoryService.create_history_entry(
                        db=db,
                        action=CardHistoryAction.ASSIGNEE_ADDED,
                        card_id=card.id,
                        project_id=card.project_id,
                        user_id=user_id,
                        details={"assignee_name": user.name, "assignee_id": assignee_id}
                    )

            # Criar histórico para cada assignee removido
            for assignee_id in removed_assignees:
                user = db.query(User).filter(User.id == assignee_id).first()
                if user:
                    CardHistoryService.create_history_entry(
                        db=db,
                        action=CardHistoryAction.ASSIGNEE_REMOVED,
                        card_id=card.id,
                        project_id=card.project_id,
                        user_id=user_id,
                        details={"assignee_name": user.name, "assignee_id": assignee_id}
                    )

            if added_assignees or removed_assignees:
                db.commit()

        return card

    @staticmethod
    def delete_card(db: Session, card_id: int, user_id: int) -> bool:
        """Deletar tarefa"""

        card = CardService.get_card_by_id(db, card_id, user_id)

        # Verificar permissão de edição
        if not ProjectService.user_can_edit_project(db, card.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para deletar esta tarefa"
            )

        column_id = card.column_id
        position = card.position

        # Deletar card
        db.delete(card)

        # Ajustar posições dos outros cards
        CardService._adjust_positions_on_delete(db, column_id, position)

        db.commit()
        return True

    @staticmethod
    def move_card(db: Session, card_id: int, move_data: CardMove, user_id: int) -> Card:
        """Mover tarefa para outra coluna/posição"""

        card = CardService.get_card_by_id(db, card_id, user_id)

        # Verificar permissão de edição
        if not ProjectService.user_can_edit_project(db, card.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para mover esta tarefa"
            )

        # Verificar se coluna de destino existe no mesmo projeto
        target_column = db.query(KanbanColumn).filter(
            and_(
                KanbanColumn.id == move_data.column_id,
                KanbanColumn.project_id == card.project_id
            )
        ).first()

        if not target_column:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coluna de destino não encontrada"
            )

        old_column_id = card.column_id
        old_position = card.position
        new_column_id = move_data.column_id
        new_position = move_data.new_position

        # Guardar nome da coluna antiga para histórico
        old_column = db.query(KanbanColumn).filter(KanbanColumn.id == old_column_id).first()
        old_column_name = old_column.title if old_column else "Desconhecida"

        # Se mudou de coluna
        if old_column_id != new_column_id:
            # Ajustar posições na coluna de origem
            CardService._adjust_positions_on_delete(db, old_column_id, old_position)

            # Ajustar posições na coluna de destino
            CardService._adjust_positions_on_insert(db, new_column_id, new_position)

            # Atualizar card
            card.column_id = new_column_id
            card.position = new_position

            # Se moveu para "Concluído", marcar data de conclusão
            if target_column.title.lower() in ["concluído", "done", "finalizado"]:
                card.completed_at = datetime.utcnow()
            else:
                card.completed_at = None

        # Se mudou apenas a posição na mesma coluna
        elif old_position != new_position:
            CardService._reorder_cards_in_column(db, new_column_id, old_position, new_position)
            card.position = new_position

        db.commit()
        db.refresh(card)

        # Registrar histórico de movimentação (apenas se mudou de coluna)
        if old_column_id != new_column_id:
            CardHistoryService.create_history_entry(
                db=db,
                action=CardHistoryAction.MOVED,
                card_id=card.id,
                project_id=card.project_id,
                user_id=user_id,
                details={
                    "from_column": old_column_name,
                    "to_column": target_column.title
                }
            )
            db.commit()

        return card

    @staticmethod
    def update_card_status(db: Session, card_id: int, status_data: CardStatusUpdate, user_id: int) -> Card:
        """Atualizar status da tarefa"""

        card = CardService.get_card_by_id(db, card_id, user_id)

        # Verificar permissão de edição
        if not ProjectService.user_can_edit_project(db, card.project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para alterar status desta tarefa"
            )

        card.status = status_data.status

        db.commit()
        db.refresh(card)

        return card

    # === MÉTODOS AUXILIARES ===

    @staticmethod
    def _add_assignees(db: Session, card: Card, assignee_ids: List[int], project_id: int):
        """Adicionar usuários atribuídos ao card"""

        if not assignee_ids:
            return

        # Buscar todos os usuários solicitados
        users = db.query(User).filter(User.id.in_(assignee_ids)).all()

        if not users:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuários não encontrados"
            )

        if len(users) != len(assignee_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alguns usuários não foram encontrados"
            )

        # TODO: Validar se usuários são membros do projeto (desabilitado temporariamente)
        # Por enquanto, permite qualquer usuário válido ser atribuído

        card.assignees.extend(users)

    @staticmethod
    def _adjust_positions_on_insert(db: Session, column_id: int, insert_position: int):
        """Ajustar posições quando inserir novo card"""

        cards_to_update = db.query(Card).filter(
            and_(
                Card.column_id == column_id,
                Card.position >= insert_position
            )
        ).all()

        for card in cards_to_update:
            card.position += 1

    @staticmethod
    def _adjust_positions_on_delete(db: Session, column_id: int, deleted_position: int):
        """Ajustar posições quando deletar card"""

        cards_to_update = db.query(Card).filter(
            and_(
                Card.column_id == column_id,
                Card.position > deleted_position
            )
        ).all()

        for card in cards_to_update:
            card.position -= 1

    @staticmethod
    def _reorder_cards_in_column(db: Session, column_id: int, old_position: int, new_position: int):
        """Reordenar cards quando mover dentro da mesma coluna"""

        if old_position < new_position:
            # Mover para frente
            cards_to_update = db.query(Card).filter(
                and_(
                    Card.column_id == column_id,
                    Card.position > old_position,
                    Card.position <= new_position
                )
            ).all()

            for card in cards_to_update:
                card.position -= 1

        else:
            # Mover para trás
            cards_to_update = db.query(Card).filter(
                and_(
                    Card.column_id == column_id,
                    Card.position >= new_position,
                    Card.position < old_position
                )
            ).all()

            for card in cards_to_update:
                card.position += 1