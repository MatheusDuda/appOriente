"""
Schemas combinados que dependem de múltiplos tipos
Este arquivo resolve o problema de import circular entre Column e Card
"""
from typing import List
from pydantic import BaseModel

# Imports dos schemas base
from app.schemas.Column import ColumnResponse
from app.schemas.Card import CardResponse


class ColumnWithCards(ColumnResponse):
    """Coluna com lista de cards"""
    cards: List[CardResponse] = []

    class Config:
        from_attributes = True
