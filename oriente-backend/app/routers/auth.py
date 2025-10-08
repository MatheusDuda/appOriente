from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.schemas.user import RegisterRequest, LoginRequest, LoginResponse, UserDto, ApiResponse
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)


@router.post("/register", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Endpoint para registro de novos usuários
    POST /api/auth/register

    Equivalente a: AuthController.register()
    """
    try:
        user_dto = AuthService.register(request, db)

        return ApiResponse(
            success=True,
            message="Usuário registrado com sucesso",
            data=user_dto.model_dump()
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )


@router.post("/login", response_model=ApiResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint para login de usuários
    POST /api/auth/login

    Equivalente a: AuthController.login()
    """
    try:
        login_response = AuthService.login(request, db)

        return ApiResponse(
            success=True,
            message="Login realizado com sucesso",
            data=login_response.model_dump()
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )


@router.get("/me", response_model=ApiResponse)
def get_current_user(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Endpoint para obter dados do usuário atual
    GET /api/auth/me
    Requer autenticação (via JWT Bearer token)

    Equivalente a: AuthController.getCurrentUser()
    """
    try:
        # Buscar dados do usuário
        user_dto = AuthService.get_current_user(user_id, db)

        return ApiResponse(
            success=True,
            message="Dados do usuário obtidos com sucesso",
            data=user_dto.model_dump()
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )


@router.post("/logout", response_model=ApiResponse)
def logout():
    """
    Endpoint para logout (opcional)
    POST /api/auth/logout

    Como estamos usando JWT stateless, o logout é feito no frontend
    removendo o token do localStorage

    Equivalente a: AuthController.logout()
    """
    return ApiResponse(
        success=True,
        message="Logout realizado com sucesso",
        data=None
    )
