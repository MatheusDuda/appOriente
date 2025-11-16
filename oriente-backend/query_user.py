#!/usr/bin/env python3
"""Script para buscar informações do usuário João Silva"""

from app.core.database import SessionLocal
from app.models.user import User

def main():
    db = SessionLocal()
    try:
        # Busca usuários com nome João
        users = db.query(User).filter(
            (User.name.ilike('%João%')) | (User.name.ilike('%Joao%'))
        ).all()

        if users:
            for user in users:
                print(f'\n{"="*60}')
                print(f'Usuário: {user.name}')
                print(f'{"="*60}')
                print(f'ID: {user.id}')
                print(f'Email: {user.email}')
                print(f'Role: {user.role}')
                print(f'Status: {user.status}')
                print(f'Criado em: {user.created_at}')
                print(f'Atualizado em: {user.updated_at}')

                # IMPORTANTE: A senha está em hash, não é possível recuperar a senha original
                print(f'\nNOTA: A senha está armazenada como hash bcrypt.')
                print(f'Para fazer login, você precisa usar a senha que foi definida')
                print(f'ao criar o usuário (geralmente definida em seeds/migrations).')
                print(f'{"="*60}')
        else:
            print('\nNenhum usuário encontrado com o nome João/Joao')

            # Lista todos os usuários
            print('\n=== TODOS OS USUÁRIOS NO BANCO ===')
            all_users = db.query(User).all()
            for user in all_users:
                print(f'ID: {user.id:3} | Nome: {user.name:30} | Email: {user.email:35} | Role: {user.role}')

    finally:
        db.close()

if __name__ == '__main__':
    main()
