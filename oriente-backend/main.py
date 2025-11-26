from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, projects, users, teams, notifications, reports, attachments, chat, chat_ws, cards_ws
from app.routers import Columns as columns, Cards as cards, comments, card_history, comment_attachments, chat_message_attachments

# Criar tabelas no banco de dados
# Equivalente ao spring.jpa.hibernate.ddl-auto=create-drop
# COMENTADO: O banco Railway já possui estrutura/dados
# Base.metadata.create_all(bind=engine)

# Criar aplicação FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/swagger-ui.html",  # Equivalente ao Swagger do Spring
    redoc_url="/api-docs"
)

# Configurar CORS
# Equivalente ao @CrossOrigin(origins = "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(notifications.router)

# Routers do Kanban
app.include_router(columns.router, prefix="/api/projects", tags=["Columns"])
app.include_router(cards.router, prefix="/api/projects", tags=["Cards"])
app.include_router(comments.router, prefix="/api/projects", tags=["Comments"])
app.include_router(card_history.router, prefix="/api/projects", tags=["Card History"])
app.include_router(attachments.router, prefix="/api/projects", tags=["Attachments"])
app.include_router(comment_attachments.router, prefix="/api/projects", tags=["Comment Attachments"])

# Router de Relatórios
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

# Routers de Chat
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(chat_ws.router, prefix="/ws", tags=["WebSocket"])
app.include_router(chat_message_attachments.router, prefix="/api/chats", tags=["Chat Message Attachments"])

# Router WebSocket para Cards/Tarefas
app.include_router(cards_ws.router, prefix="/ws", tags=["WebSocket Cards"])


@app.get("/")
def root():
    """
    Endpoint raiz
    """
    return {
        "message": "Oriente Backend API",
        "version": settings.APP_VERSION,
        "docs": "/swagger-ui.html"
    }


@app.get("/health")
def health_check():
    """
    Endpoint de health check
    Equivalente ao Spring Actuator
    """
    return {
        "status": "UP",
        "application": settings.APP_NAME
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.DEBUG
    )
