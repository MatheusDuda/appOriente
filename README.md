# Nome do Projeto

Uma aplicação web moderna construída com FastAPI e Python.

## 🚀 Tecnologias

- **FastAPI** - Framework web moderno e rápido para construção de APIs com Python
- **Python 3.8+** - Linguagem de programação
- **Uvicorn** - Servidor ASGI para FastAPI
- **Pydantic** - Validação de dados usando anotações de tipo do Python
- **SQLAlchemy** - Kit de ferramentas SQL e ORM (opcional)
- **Alembic** - Ferramenta de migração de banco de dados (opcional)

## 📋 Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes do Python)

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositório>
cd <nome-do-projeto>
```

2. Crie um ambiente virtual:
```bash
python -m venv venv
```

3. Ative o ambiente virtual:
```bash
# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

4. Instale as dependências:
```bash
pip install -r requirements.txt
```

## 🏃‍♂️ Executando a Aplicação

1. Inicie o servidor de desenvolvimento:
```bash
uvicorn main:app --reload
```

2. Abra seu navegador e acesse:
- API: http://localhost:8000
- Documentação interativa da API: http://localhost:8000/docs
- Documentação alternativa da API: http://localhost:8000/redoc

## 📁 Estrutura do Projeto

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py          # Ponto de entrada da aplicação FastAPI
│   ├── models/          # Modelos de banco de dados
│   ├── routers/         # Manipuladores de rotas da API
│   ├── schemas/         # Modelos Pydantic
│   ├── database.py      # Configuração do banco de dados
│   └── dependencies.py  # Injeção de dependência
├── tests/               # Arquivos de teste
├── requirements.txt     # Dependências Python
├── .env                 # Variáveis de ambiente
└── README.md           # Este arquivo
```

## 🔧 Configuração

Crie um arquivo `.env` no diretório raiz com sua configuração:

```env
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=sua-chave-secreta
DEBUG=True
```

## 🧪 Testes

Execute os testes usando pytest:
```bash
pytest
```

## 📚 Documentação da API

A documentação da API é gerada automaticamente pelo FastAPI e está disponível em:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua funcionalidade (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -am 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## 👥 Autores

- Seu Nome - Trabalho inicial

## 🙏 Agradecimentos

- Comunidade FastAPI pelo excelente framework
- Comunidade Python pelo incrível ecossistema
