#!/usr/bin/env python
"""
Script para inicializar o servidor FastAPI
Equivalente ao: mvnw spring-boot:run (Spring Boot)
"""

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings

    print(f"🚀 Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Servidor: http://{settings.SERVER_HOST}:{settings.SERVER_PORT}")
    print(f"📚 Swagger: http://localhost:{settings.SERVER_PORT}/swagger-ui.html")
    print(f"📖 ReDoc: http://localhost:{settings.SERVER_PORT}/api-docs")
    print()

    uvicorn.run(
        "main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=settings.DEBUG
    )
