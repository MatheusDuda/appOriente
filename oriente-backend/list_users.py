"""
Script para listar todos os usuários do banco de dados
"""
from app.core.database import SessionLocal
from app.models.user import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()

        if not users:
            print("Nenhum usuário encontrado no banco de dados.")
            return

        print(f"\n{'='*80}")
        print(f"Total de usuários: {len(users)}")
        print(f"{'='*80}\n")

        for user in users:
            print(f"ID: {user.id}")
            print(f"Nome: {user.name}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role.value}")
            print(f"Status: {user.status.value}")
            print(f"Criado em: {user.created_at}")
            print(f"Atualizado em: {user.updated_at}")
            print(f"{'-'*80}\n")

    finally:
        db.close()

if __name__ == "__main__":
    list_users()
