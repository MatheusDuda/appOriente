# 🎯 Oriente Backend

Backend completo para sistema de gerenciamento de projetos com Kanban, chat em tempo real e analytics.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791.svg)
![WebSocket](https://img.shields.io/badge/WebSocket-Enabled-orange.svg)

## ✨ Features

- 🔐 **Autenticação JWT** com roles (Admin/User)
- 👥 **Gestão de Times e Projetos** com membros e permissões
- 📋 **Sistema Kanban** completo (colunas, cards, drag-and-drop, tags, prioridades)
- 💬 **Chat em Tempo Real** via WebSocket (individual e em grupo)
- 🔔 **Notificações** automáticas com sistema de menções (@username)
- 📎 **Upload de Anexos** com validação e quota
- 📊 **Relatórios e Analytics** com exportação em PDF
- 📝 **Audit Trail** completo de mudanças em cards
- 🔍 **Histórico de Comentários** com soft delete

## 🛠️ Tech Stack

- **Framework:** FastAPI 0.104.1
- **Database:** PostgreSQL 12+ com SQLAlchemy ORM
- **Autenticação:** JWT (HS256) + BCrypt
- **Real-time:** WebSocket para chat
- **Validação:** Pydantic schemas
- **PDF:** ReportLab 4.0.7
- **CORS:** Configurado para frontend

## ⚡ Quick Start

### Requisitos
- Python 3.9+
- PostgreSQL 12+

### Instalação

```bash
# 1. Clone e entre no diretório
cd oriente-backend

# 2. Crie e ative ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows

# 3. Instale dependências
pip install -r requirements.txt

# 4. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL

# 5. Execute a aplicação
python main.py
```

Servidor rodando em: **http://localhost:8080**

## 📚 Documentação

Após iniciar o servidor:

- **Swagger UI (interativo):** http://localhost:8080/docs
- **ReDoc (documentação):** http://localhost:8080/redoc
- **Postman Collection:** `Oriente_API_Collection.postman_collection.json` (raiz do projeto)

### Principais Endpoints

| Categoria | Endpoints | Descrição |
|-----------|-----------|-----------|
| Auth | `/api/auth/*` | Register, Login, Me, Logout |
| Users | `/api/users/*` | CRUD usuários, ativar/desativar |
| Teams | `/api/teams/*` | Gestão de times e membros |
| Projects | `/api/projects/*` | CRUD projetos, membros, ownership |
| Kanban | `/api/projects/{id}/columns/*` | Colunas do board |
| Cards | `/api/projects/{id}/cards/*` | Cards, tags, movimentação |
| Comments | `/api/projects/{id}/cards/{id}/comments/*` | Comentários com menções |
| Chat | `/api/chats/*` | Chat HTTP (CRUD mensagens) |
| WebSocket | `/ws/chat/{chat_id}` | Chat em tempo real |
| Notifications | `/api/notifications/*` | Central de notificações |
| Attachments | `/api/projects/{id}/attachments/*` | Upload de arquivos |
| Reports | `/api/reports/*` | Analytics e exportação PDF |

**Total:** 85+ endpoints implementados

## 🏗️ Arquitetura

```
oriente-backend/
├── app/
│   ├── core/           # Config, database, security, dependencies
│   ├── models/         # 14 SQLAlchemy models (User, Project, Card, Chat...)
│   ├── schemas/        # Pydantic DTOs para validação
│   ├── routers/        # 14 routers FastAPI (controllers)
│   ├── services/       # Lógica de negócio (~5000 linhas)
│   └── utils/          # Utilitários
├── main.py             # Entry point da aplicação
├── requirements.txt    # Dependências Python
└── .env.example        # Template de configuração
```

### Modelos Principais

**User** • **Team** • **Project** • **KanbanColumn** • **Card** • **Tag** • **Comment** • **CommentMention** • **CardHistory** • **Notification** • **Attachment** • **Chat** • **ChatMessage** • **CommentAudit**

## 🔐 Autenticação

A API usa **JWT (JSON Web Tokens)** para autenticação:

1. Faça login: `POST /api/auth/login`
2. Receba o token JWT (válido por 24h)
3. Inclua em requisições protegidas:
   ```
   Authorization: Bearer {seu_token_jwt}
   ```

**Roles:** `ADMIN` (acesso total) e `USER` (acesso padrão)

## 🗄️ Banco de Dados

PostgreSQL com criação automática de tabelas via SQLAlchemy.

**Principais relacionamentos:**
- Users ↔ Projects (many-to-many via members)
- Projects ↔ Cards (one-to-many via columns)
- Cards ↔ Users (many-to-many assignees)
- Cards ↔ Tags (many-to-many)
- Comments → Users (mentions via CommentMention)

## 🧪 Desenvolvimento

Execute com hot-reload:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

## 📄 Licença

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC).
