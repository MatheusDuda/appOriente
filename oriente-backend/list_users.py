#!/usr/bin/env python3
"""
Script para listar todos os usuários do banco de dados
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User

def list_users():
    """Lista todos os usuários do banco"""

    db = SessionLocal()
    try:
        # Buscar todos os usuários
        users = db.query(User).all()

        if not users:
            print("❌ Nenhum usuário encontrado no banco de dados")
            return

        print(f"✅ Encontrados {len(users)} usuário(s):")
        print("-" * 80)

        for user in users:
            print(f"ID: {user.id}")
            print(f"Nome: {user.name}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print(f"Status: {user.status}")
            print(f"Criado em: {user.created_at}")
            print(f"Atualizado em: {user.updated_at}")
            print("-" * 80)

    except Exception as e:
        print(f"❌ Erro ao listar usuários: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()