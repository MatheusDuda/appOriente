# appOriente - Sistema de Gestão Fullstack

Uma aplicação web completa para gestão de projetos, equipes e tarefas, construída com arquitetura fullstack moderna.

## 🏗️ Arquitetura

Este projeto é composto por:
- **Frontend**: React + TypeScript + Vite + Material-UI
- **Backend**: Python + FastAPI + SQLAlchemy

## 🚀 Tecnologias

### Frontend
- **React 19** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset tipado do JavaScript
- **Vite** - Build tool moderna e rápida
- **Material-UI (MUI)** - Componentes React com design system
- **React Router DOM** - Roteamento para aplicações React
- **Tailwind CSS** - Framework CSS utilitário
- **Recharts** - Biblioteca de gráficos para React

### Backend
- **FastAPI** - Framework web moderno e rápido para construção de APIs
- **Python 3.8+** - Linguagem de programação
- **Uvicorn** - Servidor ASGI para FastAPI
- **Pydantic** - Validação de dados usando anotações de tipo
- **SQLAlchemy** - ORM para Python
- **Alembic** - Ferramenta de migração de banco de dados

## 📋 Pré-requisitos

- **Node.js 18+** e **npm** (para o frontend)
- **Python 3.8+** e **pip** (para o backend)

## 🛠️ Instalação e Execução

### Frontend (React + TypeScript)

1. Instale as dependências do frontend:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse a aplicação:
- Frontend: http://localhost:5173

### Backend (FastAPI + Python)

1. Navegue para o diretório do backend:
```bash
cd oriente-backend
```

2. Crie e ative um ambiente virtual:
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Execute o servidor da API:
```bash
uvicorn main:app --reload
```

5. Acesse a API:
- API: http://localhost:8000
- Documentação Swagger: http://localhost:8000/docs
- Documentação ReDoc: http://localhost:8000/redoc

## 📁 Estrutura do Projeto

```
appOriente/
├── src/                     # Frontend React
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Chat/           # Componentes de chat
│   │   ├── Common/         # Componentes comuns
│   │   ├── Equipes/        # Componentes de equipes
│   │   ├── Projetos/       # Componentes de projetos
│   │   ├── Tarefas/        # Componentes de tarefas
│   │   └── Usuarios/       # Componentes de usuários
│   ├── contexts/           # Contextos React (Auth, Theme)
│   ├── pages/              # Páginas da aplicação
│   ├── layouts/            # Layouts base
│   └── routes/             # Configuração de rotas
├── oriente-backend/        # Backend FastAPI
│   ├── main.py            # Ponto de entrada da API
│   ├── models/            # Modelos de banco de dados
│   ├── routers/           # Endpoints da API
│   ├── schemas/           # Esquemas Pydantic
│   └── database.py        # Configuração do banco
├── public/                # Assets estáticos
├── package.json           # Dependências do frontend
├── vite.config.ts         # Configuração do Vite
├── tailwind.config.js     # Configuração do Tailwind
└── tsconfig.json          # Configuração do TypeScript
```

## ⚙️ Scripts Disponíveis

### Frontend
```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run lint     # Executar linter
npm run preview  # Preview do build
```

### Backend
```bash
uvicorn main:app --reload    # Servidor de desenvolvimento
pytest                       # Executar testes
```

## 🎨 Funcionalidades

- **Dashboard** com métricas e gráficos
- **Gestão de Projetos** com quadros Kanban
- **Gestão de Equipes** e membros
- **Sistema de Tarefas** com drag-and-drop
- **Chat** em tempo real
- **Relatórios** personalizáveis
- **Sistema de Permissões**
- **Modo Escuro/Claro**
- **Notificações** em tempo real

## 🔧 Configuração

Crie arquivos de configuração para ambiente:

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
```

### Backend (.env)
```env
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=sua-chave-secreta-super-segura
DEBUG=True
```

## 🧪 Testes

### Frontend
```bash
npm run test
```

### Backend
```bash
pytest
```

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua funcionalidade (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -am 'feat: adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.

## 🙏 Agradecimentos

- Comunidade React pelo excelente ecossistema
- Comunidade FastAPI pelo framework incrível
- Material-UI pela biblioteca de componentes
- Vite pela ferramenta de build moderna
