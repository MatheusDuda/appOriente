from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserStatus
from app.schemas.user import RegisterRequest, LoginRequest, LoginResponse, UserDto
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:
    """
    Serviço de autenticação
    Equivalente a: com.oriente.oriente_backend.service.AuthService
    """

    @staticmethod
    def register(request: RegisterRequest, db: Session) -> UserDto:
        """
        Registra um novo usuário no sistema
        """
        # Verificar se email já existe
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado no sistema"
            )

        # Criar nova instância do usuário
        user = User(
            name=request.name,
            email=request.email,
            password_hash=hash_password(request.password),  # Hash da senha usando BCrypt
            role=request.role if request.role else "USER",
            status=UserStatus.ACTIVE
        )

        # Salvar no banco de dados
        db.add(user)
        db.commit()
        db.refresh(user)

        # Converter para DTO e retornar (sem senha)
        return AuthService._convert_to_user_dto(user)

    @staticmethod
    def login(request: LoginRequest, db: Session) -> LoginResponse:
        """
        Autentica usuário e gera JWT
        """
        # Buscar usuário pelo email
        user = db.query(User).filter(User.email == request.email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas"
            )

        # Verificar senha usando BCrypt
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas"
            )

        # Gerar JWT token
        token = create_access_token(
            user_id=user.id,
            email=user.email,
            name=user.name,
            role=user.role
        )

        # Converter user para DTO
        user_dto = AuthService._convert_to_user_dto(user)

        # Retornar resposta com token
        return LoginResponse(token=token, user=user_dto)

    @staticmethod
    def get_current_user(user_id: int, db: Session) -> UserDto:
        """
        Busca usuário pelo ID (para endpoint /me)
        """
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        return AuthService._convert_to_user_dto(user)

    @staticmethod
    def get_user_by_email(email: str, db: Session) -> UserDto:
        """
        Busca usuário pelo email
        """
        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        return AuthService._convert_to_user_dto(user)

    @staticmethod
    def _convert_to_user_dto(user: User) -> UserDto:
        """
        Converte entidade User para UserDto (sem senha)
        """
        return UserDto(
            id=user.id,
            name=user.name,
            email=user.email,
            role=str(user.role)  # Converter enum para string
        )
