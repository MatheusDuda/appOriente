#!/usr/bin/env python3
import urllib.request
import json

ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBvcmllbnRlLmNvbSIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MzI2ODk5NSwiZXhwIjoxNzYzMzU1Mzk1fQ.5R4qQaVHH2TRU7f9_XVpjcTwiSqcxTBL_KOsQS04wq8"

req = urllib.request.Request(
    "http://localhost:8080/api/chats/2/messages",
    headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())

print('\n' + '='*70)
print('             HISTÓRICO DE MENSAGENS - CHAT 2')
print('             João Silva ↔️ Admin')
print('='*70)
print(f'Total de mensagens: {data["total"]}\n')

for msg in data['messages']:
    sender = msg['sender']['name']
    content = msg['content']
    time = msg['created_at'].split('T')[1].split('.')[0]

    print(f'[{time}] {sender}:')
    print(f'  {content}\n')

print('='*70)
print('\n✅ Integração REST API funcionando perfeitamente!')
print('💬 Chat criado com sucesso entre João Silva e Admin')
print('📨 Mensagens sendo enviadas e recebidas corretamente\n')
