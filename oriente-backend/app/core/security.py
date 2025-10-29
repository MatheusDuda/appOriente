import bcrypt
from datetime import datetime, timedelta
from typing import Optional
import jwt
from .config import settings


def hash_password(password: str) -> str:
    """
    Gera hash BCrypt da senha
    Equivalente a: passwordEncoder.encode()
    """
    # Truncar senha se for muito longa (bcrypt tem limite de 72 bytes)
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha corresponde ao hash
    Equivalente a: passwordEncoder.matches()
    """
    # Truncar senha se for muito longa (bcrypt tem limite de 72 bytes)
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(user_id: int, email: str, name: str, role: str) -> str:
    """
    Gera token JWT
    Equivalente a: JwtTokenProvider.generateToken()
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)

    to_encode = {
        "sub": str(user_id),  # subject: userId
        "email": email,
        "name": name,
        "role": role,
        "iat": datetime.utcnow(),  # issued at
        "exp": expire  # expiration
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica e valida token JWT
    Equivalente a: JwtTokenProvider.validateToken() + getUserIdFromToken()
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None


def get_user_id_from_token(token: str) -> Optional[int]:
    """
    Extrai o user_id do token
    Equivalente a: JwtTokenProvider.getUserIdFromToken()
    """
    payload = decode_access_token(token)
    if payload:
        return int(payload.get("sub"))
    return None


def get_email_from_token(token: str) -> Optional[str]:
    """
    Extrai o email do token
    Equivalente a: JwtTokenProvider.getEmailFromToken()
    """
    payload = decode_access_token(token)
    if payload:
        return payload.get("email")
    return None
