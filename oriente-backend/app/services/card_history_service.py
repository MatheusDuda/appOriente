from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional, Tuple
from datetime import datetime
from fastapi import HTTPException, status
import math

from app.models.card_history import CardHistory, CardHistoryAction
from app.models.Card import Card
from app.services.project_service import ProjectService


class CardHistoryService:
    """
    Service para gerenciar o histórico de alterações dos cards
    """

    @staticmethod
    def get_card_history(
        db: Session,
        project_id: int,
        card_id: int,
        user_id: int,
        page: int = 1,
        size: int = 20
    ) -> Tuple[List[CardHistory], int, int]:
        """
        Busca o histórico de um card com paginação

        Args:
            db: Sessão do banco de dados
            project_id: ID do projeto
            card_id: ID do card
            user_id: ID do usuário fazendo a requisição
            page: Número da página (começa em 1)
            size: Quantidade de itens por página

        Returns:
            Tupla com (lista de históricos, total de registros, total de páginas)

        Raises:
            HTTPException: Se o usuário não tiver permissão ou o card não existir
        """
        # Validar permissão de acesso ao projeto
        if not ProjectService.user_can_access_project(db, project_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este projeto"
            )

        # Verificar se o card existe e pertence ao projeto
        card = db.query(Card).filter(
            and_(Card.id == card_id, Card.project_id == project_id)
        ).first()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Card não encontrado neste projeto"
            )

        # Construir query base com ordenação (mais recente primeiro)
        query = db.query(CardHistory).filter(
            and_(
                CardHistory.card_id == card_id,
                CardHistory.project_id == project_id
            )
        ).options(
            joinedload(CardHistory.user)  # Eager loading do usuário
        ).order_by(CardHistory.created_at.desc())

        # Contar total de registros
        total = query.count()

        # Aplicar paginação
        skip = (page - 1) * size
        history_items = query.offset(skip).limit(size).all()

        # Calcular total de páginas
        total_pages = math.ceil(total / size) if total > 0 else 1

        return history_items, total, total_pages

    @staticmethod
    def create_history_entry(
        db: Session,
        action: CardHistoryAction,
        card_id: int,
        project_id: int,
        user_id: Optional[int],
        details: Optional[dict] = None,
        custom_message: Optional[str] = None
    ) -> CardHistory:
        """
        Cria uma entrada no histórico do card

        Args:
            db: Sessão do banco de dados
            action: Tipo de ação realizada
            card_id: ID do card
            project_id: ID do projeto
            user_id: ID do usuário que realizou a ação (pode ser None)
            details: Detalhes adicionais em formato JSON
            custom_message: Mensagem customizada (se None, gera automaticamente)

        Returns:
            CardHistory: Entrada de histórico criada
        """
        # Gerar mensagem se não foi fornecida
        if custom_message is None:
            message = CardHistoryService._generate_message(
                db=db,
                action=action,
                user_id=user_id,
                details=details
            )
        else:
            message = custom_message

        # Criar entrada de histórico
        history_entry = CardHistory(
            action=action,
            card_id=card_id,
            project_id=project_id,
            user_id=user_id,
            message=message,
            details=details,
            created_at=datetime.utcnow()
        )

        db.add(history_entry)
        db.flush()  # Flush para obter o ID sem commitar

        return history_entry

    @staticmethod
    def _generate_message(
        db: Session,
        action: CardHistoryAction,
        user_id: Optional[int],
        details: Optional[dict] = None
    ) -> str:
        """
        Gera mensagem legível em português para o histórico

        Args:
            db: Sessão do banco de dados
            action: Tipo de ação
            user_id: ID do usuário
            details: Detalhes da ação

        Returns:
            str: Mensagem formatada
        """
        # Buscar nome do usuário
        from app.models.User import User
        user_name = "Sistema"
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user_name = user.name

        # Mensagens base para cada ação
        messages = {
            CardHistoryAction.CREATED: f"Card criado por {user_name}",
            CardHistoryAction.UPDATED: f"Card atualizado por {user_name}",
            CardHistoryAction.MOVED: f"Card movido por {user_name}",
            CardHistoryAction.COMMENT_ADDED: f"Comentário adicionado por {user_name}",
            CardHistoryAction.COMMENT_DELETED: f"Comentário removido por {user_name}",
            CardHistoryAction.ASSIGNEE_ADDED: f"Usuário atribuído por {user_name}",
            CardHistoryAction.ASSIGNEE_REMOVED: f"Usuário removido por {user_name}",
            CardHistoryAction.TAG_ADDED: f"Tag adicionada por {user_name}",
            CardHistoryAction.TAG_REMOVED: f"Tag removida por {user_name}",
        }

        base_message = messages.get(action, f"Ação realizada por {user_name}")

        # Adicionar detalhes específicos se disponíveis
        if details:
            if action == CardHistoryAction.MOVED and "from_column" in details and "to_column" in details:
                base_message += f" de '{details['from_column']}' para '{details['to_column']}'"

            elif action == CardHistoryAction.UPDATED:
                changes = []
                if "title_changed" in details and details["title_changed"]:
                    changes.append("título")
                if "description_changed" in details and details["description_changed"]:
                    changes.append("descrição")
                if "deadline_changed" in details and details["deadline_changed"]:
                    changes.append("prazo")
                if changes:
                    base_message += f" ({', '.join(changes)})"

            elif action == CardHistoryAction.ASSIGNEE_ADDED and "assignee_name" in details:
                base_message += f": {details['assignee_name']}"

            elif action == CardHistoryAction.ASSIGNEE_REMOVED and "assignee_name" in details:
                base_message += f": {details['assignee_name']}"

            elif action == CardHistoryAction.TAG_ADDED and "tag_name" in details:
                base_message += f": {details['tag_name']}"

            elif action == CardHistoryAction.TAG_REMOVED and "tag_name" in details:
                base_message += f": {details['tag_name']}"

        return base_message
