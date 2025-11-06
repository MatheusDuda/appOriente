from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.card_history import CardHistoryAction


class CardHistoryUserInfo(BaseModel):
    """
    Informações básicas do usuário que realizou a ação
    """
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class CardHistoryResponse(BaseModel):
    """
    Schema de resposta para histórico de card
    """
    id: int
    action: CardHistoryAction = Field(..., description="Tipo de ação realizada")
    card_id: int
    project_id: int
    message: str = Field(..., description="Mensagem legível da ação")
    details: Optional[dict] = Field(None, description="Detalhes adicionais em JSON")
    created_at: datetime
    user: Optional[CardHistoryUserInfo] = Field(None, description="Usuário que realizou a ação")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "action": "CREATED",
                "card_id": 42,
                "project_id": 5,
                "message": "Card criado por João Silva",
                "details": {"title": "Implementar login"},
                "created_at": "2025-11-06T10:30:00",
                "user": {
                    "id": 10,
                    "name": "João Silva",
                    "email": "joao@example.com"
                }
            }
        }


class CardHistoryListResponse(BaseModel):
    """
    Schema para listagem paginada de histórico de cards
    """
    history: List[CardHistoryResponse] = Field(..., description="Lista de eventos do histórico")
    total: int = Field(..., description="Total de registros")
    page: int = Field(..., description="Página atual")
    size: int = Field(..., description="Itens por página")
    total_pages: int = Field(..., description="Total de páginas")

    class Config:
        json_schema_extra = {
            "example": {
                "history": [
                    {
                        "id": 1,
                        "action": "CREATED",
                        "card_id": 42,
                        "project_id": 5,
                        "message": "Card criado por João Silva",
                        "details": None,
                        "created_at": "2025-11-06T10:30:00",
                        "user": {"id": 10, "name": "João Silva", "email": "joao@example.com"}
                    }
                ],
                "total": 50,
                "page": 1,
                "size": 20,
                "total_pages": 3
            }
        }
