#!/usr/bin/env python3
"""
Script simples para criar usuário de teste
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.security import hash_password
from app.core.config import settings

def create_simple_user():
    """Cria usuário de teste diretamente via SQL"""

    # Criar engine
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Verificar se usuário existe
        result = db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": "teste@oriente.com"})
        existing_user = result.fetchone()

        if existing_user:
            print("✅ Usuário teste@oriente.com já existe!")
            print(f"   ID: {existing_user[0]}")
            print(f"   Nome: {existing_user[1]}")
            print(f"   Email: {existing_user[2]}")
            return existing_user

        # Criar hash da senha
        password_hash = hash_password("senha123")

        # Inserir usuário via SQL
        db.execute(text("""
            INSERT INTO users (name, email, password_hash, status, role, created_at, updated_at)
            VALUES (:name, :email, :password_hash, :status, :role, datetime('now'), datetime('now'))
        """), {
            "name": "Usuário Teste",
            "email": "teste@oriente.com",
            "password_hash": password_hash,
            "status": "ACTIVE",
            "role": "USER"
        })

        db.commit()

        # Buscar usuário criado
        result = db.execute(text("SELECT * FROM users WHERE email = :email"), {"email": "teste@oriente.com"})
        user = result.fetchone()

        print("✅ Usuário criado com sucesso!")
        print(f"   ID: {user[0]}")
        print(f"   Nome: {user[1]}")
        print(f"   Email: {user[2]}")
        print(f"   Status: {user[4]}")
        print(f"   Role: {user[5]}")

        return user

    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_simple_user()