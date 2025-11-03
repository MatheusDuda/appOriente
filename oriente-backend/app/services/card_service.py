from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import HTTPException, status

from app.models.Card import Card, Tag, CardStatus, CardPriority
from app.models.Column import KanbanColumn
from app.models.user import User
from app.schemas.Card import (
    CardCreate, CardUpdate, CardMove, CardStatusUpdate,
    CardFilters, TagCreate, TagUpdate
)
from app.services.project_service import ProjectService


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

        # Adicionar tags
        if card_data.tag_ids:
            CardService._add_tags(db, card, card_data.tag_ids, project_id)

        db.commit()
        db.refresh(card)

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
            joinedload(Card.tags),
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

            if filters.tag_id:
                query = query.join(Card.tags).filter(Tag.id == filters.tag_id)

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
            joinedload(Card.tags),
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

        # Atualizar campos básicos
        update_data = card_data.model_dump(exclude_unset=True, exclude={'assignee_ids', 'tag_ids'})
        for field, value in update_data.items():
            setattr(card, field, value)

        # Atualizar assignees se informado
        if card_data.assignee_ids is not None:
            # Remover assignees atuais
            card.assignees.clear()
            # Adicionar novos assignees
            if card_data.assignee_ids:
                CardService._add_assignees(db, card, card_data.assignee_ids, card.project_id)

        # Atualizar tags se informado
        if card_data.tag_ids is not None:
            # Remover tags atuais
            card.tags.clear()
            # Adicionar novas tags
            if card_data.tag_ids:
                CardService._add_tags(db, card, card_data.tag_ids, card.project_id)

        db.commit()
        db.refresh(card)

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

    # === MÉTODOS PARA TAGS ===

    @staticmethod
    def create_tag(db: Session, project_id: int, tag_data: TagCreate, user_id: int) -> Tag:
        """Criar nova tag no projeto"""

        # Verificar permissão
        if not ProjectService.user_can_edit_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para criar tags neste projeto"
            )

        # Verificar se tag já existe no projeto
        existing_tag = db.query(Tag).filter(
            and_(
                Tag.project_id == project_id,
                Tag.name == tag_data.name
            )
        ).first()

        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag com este nome já existe no projeto"
            )

        tag = Tag(
            name=tag_data.name,
            color=tag_data.color,
            project_id=project_id
        )

        db.add(tag)
        db.commit()
        db.refresh(tag)

        return tag

    @staticmethod
    def get_project_tags(db: Session, project_id: int, user_id: int) -> List[Tag]:
        """Buscar todas as tags de um projeto"""

        # Verificar acesso ao projeto
        if not ProjectService.user_can_access_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este projeto"
            )

        tags = db.query(Tag).filter(Tag.project_id == project_id).all()
        return tags

    # === MÉTODOS AUXILIARES ===

    @staticmethod
    def _add_assignees(db: Session, card: Card, assignee_ids: List[int], project_id: int):
        """Adicionar usuários atribuídos ao card"""

        # Verificar se usuários são membros do projeto
        valid_users = db.query(User).join(User.project_memberships).filter(
            and_(
                User.id.in_(assignee_ids),
                User.project_memberships.any(project_id=project_id)
            )
        ).all()

        if len(valid_users) != len(assignee_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alguns usuários não são membros do projeto"
            )

        card.assignees.extend(valid_users)

    @staticmethod
    def _add_tags(db: Session, card: Card, tag_ids: List[int], project_id: int):
        """Adicionar tags ao card"""

        # Verificar se tags pertencem ao projeto
        valid_tags = db.query(Tag).filter(
            and_(
                Tag.id.in_(tag_ids),
                Tag.project_id == project_id
            )
        ).all()

        if len(valid_tags) != len(tag_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Algumas tags não pertencem ao projeto"
            )

        card.tags.extend(valid_tags)

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