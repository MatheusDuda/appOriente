# Oriente Backend - FastAPI

Backend do sistema de gerenciamento de projetos Oriente, convertido de Spring Boot (Java) para FastAPI (Python).

## 📋 Requisitos

- Python 3.9+
- PostgreSQL 12+
- pip

## 🚀 Instalação

1. **Clone o repositório e entre no diretório:**
```bash
cd oriente-backend
```

2. **Crie um ambiente virtual:**
```bash
python -m venv venv
```

3. **Ative o ambiente virtual:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source venv/bin/activate
     ```

4. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

5. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações do banco de dados PostgreSQL.

6. **Execute a aplicação:**
```bash
python main.py
```

Ou usando uvicorn diretamente:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **ReDoc:** http://localhost:8080/api-docs

## 🔑 Endpoints Principais

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter dados do usuário autenticado (requer JWT)
- `POST /api/auth/logout` - Logout

### Projetos

- `POST /api/projects` - Criar novo projeto (requer JWT)
- `GET /api/projects` - Listar projetos do usuário (requer JWT)
- `GET /api/projects/{id}` - Obter projeto por ID (requer JWT)
- `PUT /api/projects/{id}` - Atualizar projeto (requer JWT)
- `DELETE /api/projects/{id}` - Deletar projeto (requer JWT)

## 🏗️ Estrutura do Projeto

```
oriente-backend/
├── app/
│   ├── core/           # Configurações, database, security
│   ├── models/         # Modelos SQLAlchemy (entidades)
│   ├── schemas/        # Schemas Pydantic (DTOs)
│   ├── routers/        # Routers FastAPI (controllers)
│   ├── services/       # Lógica de negócio
│   └── utils/          # Utilitários
├── main.py             # Aplicação principal
├── requirements.txt    # Dependências
├── .env.example        # Exemplo de variáveis de ambiente
└── README.md           # Este arquivo
```

## 🔄 Mapeamento Spring Boot → FastAPI

| Spring Boot | FastAPI |
|-------------|---------|
| `@RestController` | `APIRouter` |
| `@Service` | Classes de serviço estáticas |
| `@Entity` | SQLAlchemy models |
| DTOs | Pydantic schemas |
| JPA Repository | SQLAlchemy queries |
| Spring Security | FastAPI Security + JWT |
| `@Autowired` | Dependency Injection (`Depends()`) |
| `application.properties` | `.env` + `pydantic-settings` |

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Para acessar endpoints protegidos:

1. Faça login em `/api/auth/login`
2. Receba o token JWT
3. Inclua o token no header: `Authorization: Bearer {token}`

## 🗄️ Banco de Dados

O projeto usa PostgreSQL. As tabelas são criadas automaticamente ao iniciar a aplicação.

**Tabelas:**
- `users` - Usuários do sistema
- `projects` - Projetos
- `project_members` - Relacionamento Many-to-Many entre projetos e usuários

## 📝 Variáveis de Ambiente

Veja `.env.example` para todas as variáveis disponíveis.

## 🧪 Desenvolvimento

Para desenvolvimento, o servidor reinicia automaticamente ao detectar mudanças:

```bash
uvicorn main:app --reload
```

## 📄 Licença

Este projeto é parte do sistema Oriente.
