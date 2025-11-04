#!/usr/bin/env python3
"""
Script para criar usuário de teste diretamente no banco
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserStatus
from app.core.security import hash_password

# Importar todos os modelos para garantir que as tabelas sejam criadas
from app.models.user import User
from app.models.project import Project
from app.models.Card import Card
from app.models.Column import Column

def create_test_user():
    """Cria usuário de teste"""

    # Primeiro, criar todas as tabelas
    print("🔧 Criando tabelas do banco de dados...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas!")

    db = SessionLocal()
    try:
        # Verificar se usuário já existe
        existing_user = db.query(User).filter(User.email == 'teste@oriente.com').first()
        if existing_user:
            print("✅ Usuário teste@oriente.com já existe!")
            print(f"   ID: {existing_user.id}")
            print(f"   Nome: {existing_user.name}")
            print(f"   Role: {existing_user.role}")
            print(f"   Status: {existing_user.status}")
            return existing_user

        # Criar novo usuário
        print("📝 Criando novo usuário de teste...")

        user = User(
            name="Usuário Teste",
            email="teste@oriente.com",
            password_hash=hash_password("senha123"),
            role="USER",
            status=UserStatus.ACTIVE
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print("✅ Usuário criado com sucesso!")
        print(f"   ID: {user.id}")
        print(f"   Nome: {user.name}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Status: {user.status}")

        return user

    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()