# C:/Users/kcfle/Documents/React Projects/grad-app/backend/main.py

from typing import Dict, List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, File, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid
import os

# Import all necessary modules
import crud, models, schemas, security, database_manager, oss_manager

# Create all tables in the database (if they don't exist)
models.Base.metadata.create_all(bind=database_manager.engine)

app = FastAPI(title="Graduation Social Gallery API")

# --- Routers for Organization ---
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/users", tags=["Users"])
images_router = APIRouter(prefix="/images", tags=["Images"])

# --- CORS Configuration ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- General Endpoints ---
@app.get("/", tags=["General"])
def read_root():
    return {"message": "Welcome to the Graduation Social Gallery API"}


@app.get("/healthz", tags=["General"])
async def healthz() -> Dict[str, str]:
    return {"status": "OK"}


# --- Authentication Endpoints ---
@auth_router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database_manager.get_db)) -> models.User:
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


# --- User Endpoints ---
@users_router.get("/me", response_model=schemas.User)
def read_current_user(current_user: models.User = Depends(security.get_current_user)):
    return current_user


@users_router.get("/profile/{username}", response_model=schemas.User)
def get_user_profile(
        username: str,
        db: Session = Depends(database_manager.get_db),
        current_user: Optional[models.User] = Depends(security.get_optional_current_user)
):
    profile_user = crud.get_user_by_username(db, username=username)
    if profile_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate and attach counts
    profile_user.followers_count = crud.get_follower_count_for_user(db, user_id=profile_user.id)
    profile_user.following_count = crud.get_following_count_for_user(db, user_id=profile_user.id)

    # Check follow status if a user is logged in
    is_following = False
    if current_user and current_user.id != profile_user.id:
        follow_rel = crud.get_follow(db, follower_id=current_user.id, following_id=profile_user.id)
        if follow_rel:
            is_following = True
    profile_user.is_followed_by_current_user = is_following

    return profile_user

@users_router.post("/me/profile-picture", response_model=schemas.User)
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(database_manager.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Handles uploading a new profile picture for the currently authenticated user.
    """
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"profile-pictures/{current_user.id}-{uuid.uuid4()}{file_extension}"

    try:
        new_profile_pic_url = oss_manager.upload_file_to_oss(file=file, object_name=unique_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload profile picture: {e}")

    current_user.profile_picture_url = new_profile_pic_url
    db.commit()
    db.refresh(current_user)

    return current_user

@users_router.post("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_user(
        user_id: int,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    user_to_follow = crud.get_user(db, user_id=user_id)
    if not user_to_follow:
        raise HTTPException(status_code=404, detail="User to follow not found")

    existing_follow = crud.get_follow(db, follower_id=current_user.id, following_id=user_id)
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")

    crud.create_follow(db, follower_id=current_user.id, following_id=user_id)
    return


@users_router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(
        user_id: int,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user),
):
    follow_to_delete = crud.get_follow(db, follower_id=current_user.id, following_id=user_id)
    if not follow_to_delete:
        raise HTTPException(status_code=404, detail="Not following this user")

    crud.delete_follow(db, follow=follow_to_delete)
    return


# --- Image Endpoints ---
@images_router.get("", response_model=List[schemas.Image])
def get_all_images(sort_by: str = "newest", skip: int = 0, limit: int = 20,
                   db: Session = Depends(database_manager.get_db)):
    images = crud.get_images(db=db, sort_by=sort_by, skip=skip, limit=limit)
    # This is an N+1 query problem, but acceptable for now.
    # For high performance, this could be optimized with a more complex single query.
    for image in images:
        image.like_count = crud.get_like_count_for_image(db, image_id=image.id)
        image.comment_count = crud.get_comment_count_for_image(db, image_id=image.id)
    return images


@images_router.post("", response_model=schemas.Image)
def upload_image(
        file: UploadFile = File(...),
        caption: str = Form(""),
        tags: str = Form(""),
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"images/{uuid.uuid4()}{file_extension}"
    try:
        image_url = oss_manager.upload_file_to_oss(file=file, object_name=unique_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {e}")

    db_image = crud.create_image(db=db, owner_id=current_user.id, image_url=image_url, caption=caption)
    if tags:
        tag_names = [tag.strip() for tag in tags.split(',')]
        tag_models = crud.get_or_create_tags(db, tags=tag_names)
        crud.associate_tags_with_image(db, image=db_image, tags=tag_models)
        db.refresh(db_image)

    return db_image


@images_router.get("/{image_id}", response_model=schemas.Image)
def get_image_by_id(image_id: int, db: Session = Depends(database_manager.get_db)):
    db_image = crud.get_image(db, image_id=image_id)
    if db_image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    # Attach counts
    db_image.like_count = crud.get_like_count_for_image(db, image_id=image_id)
    db_image.comment_count = crud.get_comment_count_for_image(db, image_id=image_id)

    return db_image


@images_router.post("/{image_id}/comments", response_model=schemas.Comment)
def post_comment_on_image(
        image_id: int,
        comment: schemas.CommentCreate,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user),
):
    image = crud.get_image(db, image_id=image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    return crud.create_comment(db=db, comment=comment, image_id=image_id, author_id=current_user.id)


# Include all routers in the main FastAPI app
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(images_router)