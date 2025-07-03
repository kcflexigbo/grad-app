import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import crud, models, schemas, database_manager
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise Exception("JWT_SECRET_KEY environment variable not set")

SECRET_KEY = JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Token validity period

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- OAuth2 Scheme ---
# This tells FastAPI which URL to use to get the token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashes a plain text password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    """Authenticates a user by checking username and password."""
    user = crud.get_user_by_username(db, username=username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(database_manager.get_db)) -> models.User:
    """
    Dependency to get the current user from a JWT token.
    Raises credentials exception if token is invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme),
                              db: Session = Depends(database_manager.get_db)) -> Optional[models.User]:
    """
        Dependency to get the current user from a JWT token if present.
        If the token is missing or invalid, it returns None instead of raising an exception.
    """
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = schemas.TokenData(username=username)
    except JWTError:
        return None

    user = crud.get_user_by_username(db, username=token_data.username)
    return user

def get_current_admin_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    """
    Dependency that reuses get_current_user but adds a check
    to ensure the user has admin privileges.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

def create_password_reset_token(email: str) -> str:
    """
    Generates a secure, random token for password reset.
    This is NOT a JWT, but a simple secure token.
    """
    return secrets.token_urlsafe(32)