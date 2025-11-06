from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, projects, users, teams, notifications
from app.routers import Columns as columns, Cards as cards

# Criar tabelas no banco de dados
# Equivalente ao spring.jpa.hibernate.ddl-auto=create-drop
Base.metadata.create_all(bind=engine)

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
    allow_origins=settings.CORS_ORIGINS,
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
