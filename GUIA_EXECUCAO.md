# 🚀 Guia de Execução - Projeto Oriente

## 📁 Estrutura do Projeto
```
appOriente/
├── oriente-backend/     # API FastAPI (✅ PRONTO)
│   ├── app/            # Código da aplicação
│   ├── main.py         # Ponto de entrada
│   ├── requirements.txt # Dependências
│   ├── .env            # Configurações
│   └── venv/           # Ambiente virtual
└── oriente-frontend/   # Frontend (⚠️ VAZIO)
```

## 🏃‍♂️ Como Executar o Backend

### 1. Navegue para o diretório do backend:
```bash
cd /home/matheus-duda/Oriente/appOriente/oriente-backend
```

### 2. Ative o ambiente virtual:
```bash
source venv/bin/activate
```

### 3. Execute o servidor:
```bash
python3 main.py
```
**OU**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### 4. Acesse a aplicação:
- **API Base**: http://localhost:8080
- **Documentação Swagger**: http://localhost:8080/swagger-ui.html
- **Documentação ReDoc**: http://localhost:8080/api-docs
- **Health Check**: http://localhost:8080/health

## 🔐 Endpoints de Autenticação Disponíveis

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/api/auth/register` | Registrar novo usuário | ❌ |
| POST | `/api/auth/login` | Login do usuário | ❌ |
| GET | `/api/auth/me` | Dados do usuário atual | ✅ |
| POST | `/api/auth/logout` | Logout (stateless) | ✅ |

## 🧪 Testando a API

### Opção 1: Usando o script de teste incluído
```bash
cd /home/matheus-duda/Oriente/appOriente/oriente-backend
source venv/bin/activate
python3 test_auth.py
```

### Opção 2: Usando curl

**1. Registrar usuário:**
```bash
curl -X POST "http://localhost:8080/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "role": "USER"
  }'
```

**2. Fazer login:**
```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

**3. Acessar dados do usuário (substitua TOKEN pelo JWT recebido):**
```bash
curl -X GET "http://localhost:8080/api/auth/me" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Opção 3: Usando a documentação interativa
1. Acesse: http://localhost:8080/swagger-ui.html
2. Teste os endpoints diretamente na interface

## ⚙️ Configurações

### Arquivo .env atual:
```env
DATABASE_URL=sqlite:///./oriente.db
JWT_SECRET=oriente-super-secret-development-key...
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
CORS_ORIGINS=["*"]
APP_NAME=Oriente Backend
APP_VERSION=0.0.1
DEBUG=true
```

### Para usar PostgreSQL em produção:
Altere o `DATABASE_URL` no `.env`:
```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/oriente
```

## 🔧 Status dos Módulos

| Módulo | Status | Funcionalidades |
|--------|--------|-----------------|
| ✅ **Autenticação** | PRONTO | Registro, Login, JWT, Proteção de rotas |
| ✅ **Usuários** | PRONTO | Model, CRUD básico |
| ✅ **Projetos** | IMPLEMENTADO | Model e relacionamentos |
| ⚠️ **Frontend** | VAZIO | Precisa ser desenvolvido |

## 🌐 Próximos Passos - Frontend

Como o frontend está vazio, você pode:

### Opção 1: Criar um frontend simples com HTML/JS
```bash
cd /home/matheus-duda/Oriente/appOriente/oriente-frontend
# Criar arquivos HTML, CSS, JS para consumir a API
```

### Opção 2: Usar React/Vue/Angular
```bash
cd /home/matheus-duda/Oriente/appOriente/oriente-frontend
npx create-react-app . # Para React
# ou
vue create . # Para Vue
# ou
ng new . # Para Angular
```

### Opção 3: Testar direto pela documentação Swagger
- Acesse http://localhost:8080/swagger-ui.html
- Teste todos os endpoints diretamente

## 🐛 Solução de Problemas

### Erro de conexão com banco:
- Verifique se o arquivo `.env` existe
- Para desenvolvimento, use SQLite (já configurado)

### Erro de dependências:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Porta já em uso:
```bash
# Matar processo na porta 8080
sudo lsof -t -i:8080 | xargs kill -9
```

## 📊 Logs e Monitoramento

Os logs aparecem no terminal onde você executou o servidor:
- Logs SQL (quando DEBUG=true)
- Logs de requisições HTTP
- Logs de erros

---

**✅ O backend está 100% funcional e pronto para uso!**
**⚠️ O frontend precisa ser desenvolvido para ter uma interface web completa.**