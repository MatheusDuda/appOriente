from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Tuple
from fastapi import HTTPException, status
from app.models.user import User, UserStatus, UserRole
from app.schemas.user import UserUpdateRequest, PasswordChangeRequest, UserResponse, UserListResponse
from app.core.security import hash_password, verify_password
import math


class UserService:
    """
    Service para gerenciamento de usuários
    Equivalente a: UserService.java
    """

    def __init__(self, db: Session):
        self.db = db

    def get_all_users(self, skip: int = 0, limit: int = 10) -> UserListResponse:
        """
        Lista todos os usuários com paginação
        Equivalente a: findAllUsers()
        """
        # Buscar total de usuários
        total = self.db.query(func.count(User.id)).scalar()

        # Buscar usuários paginados
        users = (
            self.db.query(User)
            .offset(skip)
            .limit(limit)
            .all()
        )

        # Converter para UserResponse
        user_responses = [UserResponse.model_validate(user) for user in users]

        # Calcular total de páginas
        total_pages = math.ceil(total / limit) if total > 0 else 0
        page = (skip // limit) + 1

        return UserListResponse(
            users=user_responses,
            total=total,
            page=page,
            size=limit,
            total_pages=total_pages
        )

    def get_user_by_id(self, user_id: int) -> Optional[UserResponse]:
        """
        Busca usuário por ID
        Equivalente a: findById()
        """
        user = self.db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        return UserResponse.model_validate(user)

    def update_user(self, user_id: int, user_data: UserUpdateRequest, current_user_id: int, current_user_role: str) -> UserResponse:
        """
        Atualiza dados do usuário
        Equivalente a: updateUser()

        Regras de negócio:
        - Usuário só pode editar próprio perfil (exceto ADMIN)
        - Email deve ser único
        """
        # Verificar permissões
        if current_user_role != UserRole.ADMIN.value and current_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode editar seu próprio perfil"
            )

        # Buscar usuário
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Verificar se email já existe (se está sendo alterado)
        if user_data.email and user_data.email != user.email:
            existing_user = self.db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email já está em uso por outro usuário"
                )

        # Atualizar campos
        if user_data.name is not None:
            user.name = user_data.name
        if user_data.email is not None:
            user.email = user_data.email

        # Salvar mudanças
        self.db.commit()
        self.db.refresh(user)

        return UserResponse.model_validate(user)

    def change_password(self, user_id: int, password_data: PasswordChangeRequest, current_user_id: int) -> bool:
        """
        Altera senha do usuário
        Equivalente a: changePassword()

        Regras de negócio:
        - Usuário só pode alterar própria senha
        - Deve validar senha antiga
        """
        # Verificar permissões
        if current_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode alterar sua própria senha"
            )

        # Buscar usuário
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Verificar senha antiga
        if not verify_password(password_data.old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senha atual incorreta"
            )

        # Atualizar senha
        user.password_hash = hash_password(password_data.new_password)

        # Salvar mudanças
        self.db.commit()

        return True

    def deactivate_user(self, user_id: int, current_user_id: int, current_user_role: str) -> UserResponse:
        """
        Desativa conta do usuário (soft delete)
        Equivalente a: deactivateUser()

        Regras de negócio:
        - Usuário pode desativar própria conta
        - ADMIN pode desativar qualquer conta
        """
        # Verificar permissões
        if current_user_role != UserRole.ADMIN.value and current_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode desativar sua própria conta"
            )

        # Buscar usuário
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Verificar se já está inativo
        if user.status == UserStatus.INACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário já está desativado"
            )

        # Desativar usuário
        user.status = UserStatus.INACTIVE

        # Salvar mudanças
        self.db.commit()
        self.db.refresh(user)

        return UserResponse.model_validate(user)

    def activate_user(self, user_id: int, current_user_role: str) -> UserResponse:
        """
        Reativa conta do usuário (apenas ADMIN)
        Equivalente a: activateUser()
        """
        # Verificar permissões (apenas ADMIN)
        if current_user_role != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas administradores podem reativar contas"
            )

        # Buscar usuário
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Verificar se já está ativo
        if user.status == UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário já está ativo"
            )

        # Ativar usuário
        user.status = UserStatus.ACTIVE

        # Salvar mudanças
        self.db.commit()
        self.db.refresh(user)

        return UserResponse.model_validate(user)


def get_user_service(db: Session) -> UserService:
    """
    Factory function para criar instância do UserService
    Equivalente a: @Service annotation
    """
    return UserService(db)