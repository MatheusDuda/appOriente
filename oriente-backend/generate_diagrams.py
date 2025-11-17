#!/usr/bin/env python3
"""
Script para geração automática de diagramas ER e UML em formato Mermaid.

Este script analisa os models SQLAlchemy do projeto e gera:
1. Diagrama ER (Entity-Relationship) - Estrutura do banco de dados
2. Diagrama UML (Classes) - Classes Python com atributos e tipos

Uso:
    python generate_diagrams.py

Os diagramas serão gerados em:
    - docs/diagrams/er-diagram.md
    - docs/diagrams/uml-diagram.md
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Set
from datetime import datetime

# Adiciona o diretório do projeto ao path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from sqlalchemy import inspect
from sqlalchemy.orm import RelationshipProperty
from app.core.database import Base
from app.models import (
    user, team, project, Column, Card, comment, comment_mention,
    comment_audit, attachment, card_history, notification, chat, chat_message
)


class DiagramGenerator:
    """Gerador de diagramas ER e UML em formato Mermaid."""

    def __init__(self):
        self.models = self._get_all_models()
        self.output_dir = project_root / "docs" / "diagrams"
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _get_all_models(self) -> List[Any]:
        """Obtém todas as classes de models SQLAlchemy."""
        return [mapper.class_ for mapper in Base.registry.mappers]

    def _get_python_type_name(self, column) -> str:
        """Converte tipo SQLAlchemy para tipo Python legível."""
        type_str = str(column.type)

        # Mapeamento de tipos SQLAlchemy para Python
        type_mapping = {
            'INTEGER': 'int',
            'BIGINT': 'int',
            'VARCHAR': 'str',
            'TEXT': 'str',
            'BOOLEAN': 'bool',
            'DATETIME': 'datetime',
            'TIMESTAMP': 'datetime',
            'DATE': 'date',
            'FLOAT': 'float',
            'NUMERIC': 'Decimal',
        }

        for sql_type, py_type in type_mapping.items():
            if sql_type in type_str:
                return py_type

        # Se for ENUM, extrair o nome do enum
        if 'Enum' in type_str or 'enum' in type_str.lower():
            return type_str.split('.')[-1].replace(')', '').replace("'", '')

        return type_str

    def _get_cardinality(self, relationship: RelationshipProperty) -> str:
        """Determina a cardinalidade de um relacionamento."""
        if relationship.uselist:
            # É uma lista (One-to-Many ou Many-to-Many)
            if relationship.secondary is not None:
                return 'N:M'
            return '1:N'
        else:
            # É um objeto único (Many-to-One ou One-to-One)
            return 'N:1'

    def generate_er_diagram(self) -> str:
        """Gera diagrama ER (Entity-Relationship) em formato Mermaid."""
        lines = [
            "# Diagrama ER - Entidade-Relacionamento",
            "",
            f"*Gerado automaticamente em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*",
            "",
            "```mermaid",
            "erDiagram"
        ]

        # Primeiro, adicionar todas as entidades com seus atributos
        for model in sorted(self.models, key=lambda m: m.__name__):
            model_name = model.__name__
            inspector = inspect(model)

            lines.append(f"    {model_name} {{")

            # Adicionar colunas
            for column in inspector.columns:
                col_name = column.name
                col_type = self._get_python_type_name(column)

                # Adicionar indicadores especiais
                indicators = []
                if column.primary_key:
                    indicators.append("PK")
                if column.foreign_keys:
                    indicators.append("FK")
                if not column.nullable and not column.primary_key:
                    indicators.append("NOT NULL")

                indicator_str = f" {' '.join(indicators)}" if indicators else ""
                lines.append(f"        {col_type} {col_name}{indicator_str}")

            lines.append("    }")
            lines.append("")

        # Agora, adicionar relacionamentos
        processed_relationships = set()

        for model in self.models:
            model_name = model.__name__
            inspector = inspect(model)

            for relationship in inspector.relationships:
                rel_name = relationship.key
                target_model = relationship.mapper.class_.__name__

                # Evitar relacionamentos duplicados
                rel_key = tuple(sorted([model_name, target_model, rel_name]))
                if rel_key in processed_relationships:
                    continue
                processed_relationships.add(rel_key)

                # Determinar cardinalidade
                if relationship.secondary is not None:
                    # Many-to-Many
                    lines.append(f"    {model_name} }}o--o{{ {target_model} : \"{rel_name}\"")
                elif relationship.uselist:
                    # One-to-Many
                    lines.append(f"    {model_name} ||--o{{ {target_model} : \"{rel_name}\"")
                else:
                    # Many-to-One
                    lines.append(f"    {model_name} }}o--|| {target_model} : \"{rel_name}\"")

        lines.append("```")
        lines.append("")
        lines.append("## Legenda")
        lines.append("")
        lines.append("- **PK**: Primary Key (Chave Primária)")
        lines.append("- **FK**: Foreign Key (Chave Estrangeira)")
        lines.append("- **NOT NULL**: Campo obrigatório")
        lines.append("- `||--o{`: Um para muitos (One-to-Many)")
        lines.append("- `}o--||`: Muitos para um (Many-to-One)")
        lines.append("- `}o--o{`: Muitos para muitos (Many-to-Many)")
        lines.append("")

        return "\n".join(lines)

    def generate_uml_diagram(self) -> str:
        """Gera diagrama UML de classes em formato Mermaid."""
        lines = [
            "# Diagrama UML - Classes",
            "",
            f"*Gerado automaticamente em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*",
            "",
            "```mermaid",
            "classDiagram"
        ]

        # Adicionar classes
        for model in sorted(self.models, key=lambda m: m.__name__):
            model_name = model.__name__
            inspector = inspect(model)

            lines.append(f"    class {model_name} {{")

            # Adicionar atributos
            for column in inspector.columns:
                col_name = column.name
                col_type = self._get_python_type_name(column)
                lines.append(f"        +{col_type} {col_name}")

            lines.append("    }")
            lines.append("")

        # Adicionar relacionamentos
        processed_relationships = set()

        for model in self.models:
            model_name = model.__name__
            inspector = inspect(model)

            for relationship in inspector.relationships:
                rel_name = relationship.key
                target_model = relationship.mapper.class_.__name__

                # Evitar duplicatas
                rel_tuple = (model_name, target_model, rel_name)
                if rel_tuple in processed_relationships:
                    continue
                processed_relationships.add(rel_tuple)

                # Determinar tipo de relacionamento
                if relationship.secondary is not None:
                    # Many-to-Many
                    lines.append(f'    {model_name} "*" -- "*" {target_model} : {rel_name}')
                elif relationship.uselist:
                    # One-to-Many
                    lines.append(f'    {model_name} "1" -- "*" {target_model} : {rel_name}')
                else:
                    # Many-to-One
                    lines.append(f'    {model_name} "*" -- "1" {target_model} : {rel_name}')

        lines.append("```")
        lines.append("")
        lines.append("## Legenda")
        lines.append("")
        lines.append("- `1 -- *`: Relacionamento um para muitos")
        lines.append("- `* -- *`: Relacionamento muitos para muitos")
        lines.append("- `+`: Atributo público")
        lines.append("")

        return "\n".join(lines)

    def generate_all(self):
        """Gera todos os diagramas."""
        print("🔍 Analisando models do projeto...")
        print(f"   Encontrados {len(self.models)} models: {', '.join([m.__name__ for m in self.models])}")
        print()

        # Gerar Diagrama ER
        print("📊 Gerando Diagrama ER (Entity-Relationship)...")
        er_diagram = self.generate_er_diagram()
        er_path = self.output_dir / "er-diagram.md"
        er_path.write_text(er_diagram, encoding='utf-8')
        print(f"   ✅ Salvo em: {er_path}")
        print()

        # Gerar Diagrama UML
        print("📐 Gerando Diagrama UML (Classes)...")
        uml_diagram = self.generate_uml_diagram()
        uml_path = self.output_dir / "uml-diagram.md"
        uml_path.write_text(uml_diagram, encoding='utf-8')
        print(f"   ✅ Salvo em: {uml_path}")
        print()

        print("✨ Diagramas gerados com sucesso!")
        print()
        print("📖 Para visualizar os diagramas:")
        print("   1. Abra os arquivos .md no GitHub (renderização automática)")
        print("   2. Use VS Code com extensão 'Markdown Preview Mermaid Support'")
        print("   3. Cole o código em https://mermaid.live")
        print()


def main():
    """Função principal."""
    try:
        generator = DiagramGenerator()
        generator.generate_all()
    except Exception as e:
        print(f"❌ Erro ao gerar diagramas: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
