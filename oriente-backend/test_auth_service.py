#!/usr/bin/env python3
"""
Script para testar diretamente o AuthService
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.auth_service import AuthService
from app.schemas.user import LoginRequest

def test_auth_service():
    """Testa o AuthService diretamente"""

    db = SessionLocal()
    try:
        # Criar request de login
        login_request = LoginRequest(
            email="teste@oriente.com",
            password="senha123"
        )

        print(f"🔐 Testando login com:")
        print(f"Email: {login_request.email}")
        print(f"Senha: {login_request.password}")
        print("-" * 50)

        # Testar login
        try:
            login_response = AuthService.login(login_request, db)
            print("✅ Login realizado com sucesso!")
            print(f"Token: {login_response.token[:50]}...")
            print(f"Usuário: {login_response.user}")
        except Exception as e:
            print(f"❌ Erro no login: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"❌ Erro geral: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_auth_service()