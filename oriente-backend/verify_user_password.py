#!/usr/bin/env python3
"""
Script para verificar senha do usuário teste
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password

def verify_user_password():
    """Verifica se a senha do usuário teste está correta"""

    db = SessionLocal()
    try:
        # Buscar usuário teste
        user = db.query(User).filter(User.email == 'teste@oriente.com').first()

        if not user:
            print("❌ Usuário teste@oriente.com não encontrado")
            return

        print(f"✅ Usuário encontrado: {user.name}")
        print(f"Email: {user.email}")
        print(f"Status: {user.status}")
        print(f"Hash da senha: {user.password_hash}")

        # Testar a senha
        senha_teste = "senha123"
        senha_correta = verify_password(senha_teste, user.password_hash)

        print(f"\n🔐 Teste de senha:")
        print(f"Senha testada: '{senha_teste}'")
        print(f"Senha está correta: {senha_correta}")

        if senha_correta:
            print("✅ A senha está correta no banco!")
        else:
            print("❌ A senha NÃO está correta no banco")
            print("💡 Vou redefinir a senha...")

            # Redefinir senha
            from app.core.security import hash_password
            user.password_hash = hash_password("senha123")
            db.commit()
            print("✅ Senha redefinida com sucesso!")

    except Exception as e:
        print(f"❌ Erro ao verificar senha: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_user_password()