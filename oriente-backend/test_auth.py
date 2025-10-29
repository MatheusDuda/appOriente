#!/usr/bin/env python3
"""
Script para testar os endpoints de autenticação
"""
import requests
import json
import time
import threading
import uvicorn
from main import app

def test_authentication():
    """Testa todos os endpoints de autenticação"""

    # Função para iniciar o servidor
    def start_server():
        uvicorn.run(app, host='127.0.0.1', port=8081, log_level='error')

    # Iniciar servidor em thread separada
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Esperar o servidor iniciar
    time.sleep(3)

    try:
        base_url = 'http://127.0.0.1:8081'

        print("=== Testando Módulo de Autenticação ===\n")

        # 1. Testar endpoint de health
        print("1. Testando Health Check...")
        health_response = requests.get(f'{base_url}/health', timeout=5)
        print(f'   Status: {health_response.status_code}')
        print(f'   Response: {health_response.json()}\n')

        # 2. Testar registro de usuário
        print("2. Testando Registro de Usuário...")
        register_data = {
            'name': 'Usuário Teste',
            'email': 'teste@example.com',
            'password': 'senha123',
            'role': 'USER'
        }

        register_response = requests.post(f'{base_url}/api/auth/register',
                                        json=register_data, timeout=5)
        print(f'   Status: {register_response.status_code}')
        print(f'   Response: {register_response.json()}\n')

        # 3. Testar login
        print("3. Testando Login...")
        login_data = {
            'email': 'teste@example.com',
            'password': 'senha123'
        }

        login_response = requests.post(f'{base_url}/api/auth/login',
                                     json=login_data, timeout=5)
        print(f'   Status: {login_response.status_code}')
        login_result = login_response.json()
        print(f'   Response: {login_result}\n')

        if login_response.status_code == 200:
            token = login_result['data']['token']

            # 4. Testar endpoint protegido /me
            print("4. Testando Endpoint Protegido (/me)...")
            headers = {'Authorization': f'Bearer {token}'}
            me_response = requests.get(f'{base_url}/api/auth/me',
                                     headers=headers, timeout=5)
            print(f'   Status: {me_response.status_code}')
            print(f'   Response: {me_response.json()}\n')

            # 5. Testar logout
            print("5. Testando Logout...")
            logout_response = requests.post(f'{base_url}/api/auth/logout',
                                          headers=headers, timeout=5)
            print(f'   Status: {logout_response.status_code}')
            print(f'   Response: {logout_response.json()}\n')

        # 6. Testar acesso sem token
        print("6. Testando Acesso Não Autorizado...")
        unauthorized_response = requests.get(f'{base_url}/api/auth/me', timeout=5)
        print(f'   Status: {unauthorized_response.status_code}')
        print(f'   Response: {unauthorized_response.json()}\n')

        print("=== Testes Concluídos ===")

    except Exception as e:
        print(f'Erro no teste: {e}')

if __name__ == "__main__":
    test_authentication()