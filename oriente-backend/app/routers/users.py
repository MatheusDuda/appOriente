from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from typing import Annotated
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.user_service import get_user_service
from app.schemas.user import (
    UserUpdateRequest,
    PasswordChangeRequest,
    UserResponse,
    UserListResponse,
    ApiResponse,
    UserDto
)

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    responses={404: {"description": "Not found"}}
)


@router.get("", response_model=ApiResponse)
async def list_users(
    skip: Annotated[int, Query(ge=0, description="Número de registros para pular")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Número máximo de registros por página")] = 10,
    db: Session = Depends(get_db),
    current_user: UserDto = Depends(get_current_user)
):
    """
    Lista todos os usuários com paginação

    Equivalente a: GET /api/users

    Parâmetros de query:
    - skip: número de registros para pular (default: 0)
    - limit: número máximo de registros por página (default: 10, max: 100)

    Retorna:
    - Lista paginada de usuários
    - Total de registros
    - Informações de paginação
    """
    user_service = get_user_service(db)
    result = user_service.get_all_users(skip=skip, limit=limit)

    return ApiResponse(
        success=True,
        message="Usuários listados com sucesso",
        data=result.model_dump()
    )


@router.get("/{user_id}", response_model=ApiResponse)
async def get_user_by_id(
    user_id: Annotated[int, Path(description="ID do usuário")],
    db: Session = Depends(get_db),
    current_user: UserDto = Depends(get_current_user)
):
    """
    Busca usuário por ID

    Equivalente a: GET /api/users/{id}

    Parâmetros:
    - user_id: ID do usuário a ser buscado

    Retorna:
    - Dados completos do usuário
    """
    user_service = get_user_service(db)
    result = user_service.get_user_by_id(user_id)

    return ApiResponse(
        success=True,
        message="Usuário encontrado com sucesso",
        data=result.model_dump()
    )


@router.put("/{user_id}", response_model=ApiResponse)
async def update_user(
    user_id: Annotated[int, Path(description="ID do usuário")],
    user_data: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: UserDto = Depends(get_current_user)
):
    """
    Atualiza dados do usuário

    Equivalente a: PUT /api/users/{id}

    Regras de negócio:
    - Usuário só pode editar próprio perfil (exceto ADMIN)
    - Email deve ser único

    Parâmetros:
    - user_id: ID do usuário a ser atualizado
    - user_data: Dados para atualização (name, email)

    Retorna:
    - Dados atualizados do usuário
    """
    user_service = get_user_service(db)
    result = user_service.update_user(
        user_id=user_id,
        user_data=user_data,
        current_user_id=current_user.id,
        current_user_role=current_user.role
    )

    return ApiResponse(
        success=True,
        message="Usuário atualizado com sucesso",
        data=result.model_dump()
    )


@router.put("/{user_id}/password", response_model=ApiResponse)
async def change_password(
    user_id: Annotated[int, Path(description="ID do usuário")],
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: UserDto = Depends(get_current_user)
):
    """
    Altera senha do usuário

    Equivalente a: PUT /api/users/{id}/password

    Regras de negócio:
    - Usuário só pode alterar própria senha
    - Deve validar senha antiga

    Parâmetros:
    - user_id: ID do usuário
    - password_data: Senha atual e nova senha

    Retorna:
    - Confirmação da alteração
    """
    user_service = get_user_service(db)
    user_service.change_password(
        user_id=user_id,
        password_data=password_data,
        current_user_id=current_user.id
    )

    return ApiResponse(
        success=True,
        message="Senha alterada com sucesso",
        data=None
    )


@router.delete("/{user_id}", response_model=ApiResponse)
async def deactivate_user(
    user_id: Annotated[int, Path(description="ID do usuário")],
    db: Session = Depends(get_db),
    current_user: UserDto = Depends(get_current_user)
):
    """
    Desativa conta do usuário (soft delete)

    Equivalente a: DELETE /api/users/{id}

    Regras de negócio:
    - Usuário pode desativar própria conta
    - ADMIN pode desativar qualquer conta

    Parâmetros:
    - user_id: ID do usuário a ser desativado

    Retorna:
    - Dados do usuário desativado
    """
    user_service = get_user_service(db)
    result = user_service.deactivate_user(
        user_id=user_id,
        current_user_id=current_user.id,
        current_user_role=current_user.role
    )

    return ApiResponse(
        success=True,
        message="Usuário desativado com sucesso",
        data=result.model_dump()
    )


@router.patch("/{user_id}/activate", response_model=ApiResponse)
async def activate_user(
    user_id: Annotated[int, Path(description="ID do usuário")],
    db: Session = Depends(get_db),
    current_user: UserDto = Depends(get_current_user)
):
    """
    Reativa conta do usuário (apenas ADMIN)

    Equivalente a: PATCH /api/users/{id}/activate

    Regras de negócio:
    - Apenas ADMIN pode reativar contas

    Parâmetros:
    - user_id: ID do usuário a ser reativado

    Retorna:
    - Dados do usuário reativado
    """
    user_service = get_user_service(db)
    result = user_service.activate_user(
        user_id=user_id,
        current_user_role=current_user.role
    )

    return ApiResponse(
        success=True,
        message="Usuário reativado com sucesso",
        data=result.model_dump()
    )