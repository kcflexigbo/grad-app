from typing import Dict

from router import router
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta

import crud, models, schemas, security, database_manager

models.Base.metadata.create_all(bind=database_manager.engine)

app = FastAPI(title="Graduation Social Gallery API")
app.include_router(router=router)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/users", tags=["Users"])

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/")
# async def root() -> RedirectResponse:
#     return RedirectResponse(url="/healthz")

@app.get("/healthz")
async def healthz() -> Dict[str, str]:
    return {"message": "Graduation-app is online", "status": "OK"}


@auth_router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database_manager.get_db))\
         -> models.User:
    """
        Handles user registration.
        Checks for existing username or email before creating a new user.
    """
    db_user_by_email = crud.get_user_by_email(db, email=str(user.email))
    if db_user_by_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_user_by_username = crud.get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    return crud.create_user(db=db, user=user)


@auth_router.post("/token", response_model=schemas.Token)
def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(database_manager.get_db)
):
    """
    Handles user login.
    Authenticates the user and returns a JWT access token.
    """
    user = security.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Group 1: User Management Endpoints ---
@users_router.get("/me", response_model=schemas.User)
def read_current_user(current_user: models.User = Depends(security.get_current_user)):
    """
    Fetches the profile for the currently authenticated user.
    The `get_current_user` dependency handles all the token validation.
    """
    return current_user


# Include the routers in the main FastAPI app
app.include_router(auth_router)
app.include_router(users_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Graduation Social Gallery API"}