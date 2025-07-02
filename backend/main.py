import os
import uuid
from datetime import timedelta
from typing import Dict, List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, File, UploadFile, Form, Request
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import crud, models, schemas, security, database_manager, oss_manager
from connection_manager import manager

limiter = Limiter(key_func=get_remote_address)

models.Base.metadata.create_all(bind=database_manager.engine)

app = FastAPI(title="Graduation Social Gallery API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Routers for Organization ---
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/users", tags=["Users"])
media_router = APIRouter(prefix="/media", tags=["Media"])  # RENAMED
comments_router = APIRouter(prefix="/comments", tags=["Comments"])
search_router = APIRouter(prefix="/search", tags=["Search"])
albums_router = APIRouter(prefix="/albums", tags=["Albums"])
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])
reports_router = APIRouter(prefix="/reports", tags=["Reports"])
admin_router = APIRouter(prefix="/admin", tags=["Administration"])
leaderboard_router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://ratemypic-eight.vercel.app",
    # "https://ratemypix.cn",
    # "https://www.ratemypix.cn"
    "https://www.ratemygradpix.xin",
    "https://ratemygradpix.xin",
    "https://ratemypix.site",
    "https://www.ratemypix.site",
]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"],
                   allow_headers=["*"])


# --- General & WebSocket Endpoints ---
@app.get("/", tags=["General"])
def read_root():
    return {"message": "Welcome to the Graduation Social Gallery API"}


@app.get("/healthz", tags=["General"])
async def healthz() -> Dict[str, str]:
    return {"status": "OK"}


@app.websocket("/ws/notifications")
async def websocket_notifications_endpoint(websocket: WebSocket, token: str,
                                           db: Session = Depends(database_manager.get_db)):
    try:
        current_user = security.get_current_user(token=token, db=db)
        await manager.connect(current_user.id, websocket)
        try:
            while True: await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(current_user.id)
    except Exception:
        await websocket.close()


@app.websocket("/ws/comments/{media_id}")  # RENAMED from image_id
async def websocket_comments_endpoint(websocket: WebSocket, media_id: int):
    room_name = f"media-{media_id}"  # RENAMED from image-
    await manager.connect_to_room(room_name, websocket)
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_from_room(room_name, websocket)


# --- Authentication Endpoints ---
@auth_router.post("/register", response_model=schemas.User)
@limiter.limit("10/hour")
def register_user(request: Request, user: schemas.UserCreate,
                  db: Session = Depends(database_manager.get_db)) -> models.User:
    db_user_by_email = crud.get_user_by_email(db, email=str(user.email))
    if db_user_by_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_user_by_username = crud.get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    return crud.create_user(db=db, user=user)


@auth_router.post("/token", response_model=schemas.Token)
@limiter.limit("15/minute")
def login_for_access_token(
        request: Request,
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


@users_router.get("/me/albums", response_model=List[schemas.Album])
def get_my_albums(
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    """ Fetches all albums created by the currently authenticated user. """
    return crud.get_user_albums(db, user_id=current_user.id)


@users_router.get("/profile/{username}", response_model=schemas.UserProfile)
def get_user_profile(
        username: str,
        db: Session = Depends(database_manager.get_db),
        current_user: Optional[models.User] = Depends(security.get_optional_current_user)
):
    profile_user = crud.get_user_by_username(db, username=username)
    if profile_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate follower/following counts
    profile_user.followers_count = crud.get_follower_count_for_user(db, user_id=profile_user.id)
    profile_user.following_count = crud.get_following_count_for_user(db, user_id=profile_user.id)

    # Calculate follow status for the current user
    is_following = False
    if current_user and current_user.id != profile_user.id:
        follow_rel = crud.get_follow(db, follower_id=current_user.id, following_id=profile_user.id)
        if follow_rel:
            is_following = True
    profile_user.is_followed_by_current_user = is_following

    for album in profile_user.albums:
        album.media_count = len(album.media)

    return profile_user


@users_router.post("/me/profile-picture", response_model=schemas.User)
def upload_profile_picture(
        file: UploadFile = File(...),
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
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
async def follow_user(
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

    db_notification = crud.create_notification(
        db,
        recipient_id=user_id,
        actor_id=current_user.id,
        type=models.NotificationType.follow,
        related_entity_id=current_user.id
    )
    if db_notification:
        await manager.send_personal_message(
            schemas.Notification.model_validate(db_notification).model_dump_json(),
            db_notification.recipient_id
        )

    return


@users_router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
        user_id: int,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user),
):
    follow_to_delete = crud.get_follow(db, follower_id=current_user.id, following_id=user_id)
    if not follow_to_delete:
        raise HTTPException(status_code=404, detail="Not following this user")

    crud.delete_follow(db, follow=follow_to_delete)
    return


@users_router.put("/me", response_model=schemas.User)
def update_current_user_profile(
        user_update: schemas.UserUpdate,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    return crud.update_user(db=db, db_user=current_user, user_update=user_update)


@users_router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_current_user_password(
        password_data: schemas.UserPasswordChange,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    if not security.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    crud.update_user_password(db, user=current_user, new_password=password_data.new_password)
    return


@users_router.get("/{username}/followers", response_model=List[schemas.UserWithFollowStatus])
def get_user_followers_list(
        username: str,
        db: Session = Depends(database_manager.get_db),
        current_user: Optional[models.User] = Depends(security.get_optional_current_user)
):
    profile_user = crud.get_user_by_username(db, username=username)
    if not profile_user:
        raise HTTPException(status_code=404, detail="User not found")

    followers = crud.get_user_followers(db, user_id=profile_user.id)

    # Check follow status for each user in the list against the current user
    if current_user:
        following_ids = {u.id for u in crud.get_user_following(db, user_id=current_user.id)}
        for follower in followers:
            follower.is_followed_by_current_user = follower.id in following_ids

    return followers


@users_router.get("/{username}/following", response_model=List[schemas.UserWithFollowStatus])
def get_user_following_list(
        username: str,
        db: Session = Depends(database_manager.get_db),
        current_user: Optional[models.User] = Depends(security.get_optional_current_user)
):
    profile_user = crud.get_user_by_username(db, username=username)
    if not profile_user:
        raise HTTPException(status_code=404, detail="User not found")

    following_list = crud.get_user_following(db, user_id=profile_user.id)

    if current_user:
        current_user_following_ids = {u.id for u in crud.get_user_following(db, user_id=current_user.id)}
        for followed_user in following_list:
            followed_user.is_followed_by_current_user = followed_user.id in current_user_following_ids

    return following_list


# --- Media Endpoints (Previously Media Endpoints) ---
@media_router.get("", response_model=List[schemas.Media])
def get_all_media(sort_by: str = "newest", skip: int = 0, limit: int = 20,
                  db: Session = Depends(database_manager.get_db)):
    results = crud.get_all_media(db=db, sort_by=sort_by, skip=skip, limit=limit)
    media_with_counts = []
    for media, like_count, comment_count in results:
        media.like_count = like_count
        media.comment_count = comment_count
        media_with_counts.append(media)
    return media_with_counts


@media_router.post("", response_model=List[schemas.Media])
def upload_media(
        files: List[UploadFile] = File(...),
        caption: str = Form(""),
        tags: str = Form(""),
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    created_media_list = []
    tag_models = []
    if tags:
        tag_names = [tag.strip() for tag in tags.split(',')]
        tag_models = crud.get_or_create_tags(db, tags=tag_names)

    for file in files:
        content_type = file.content_type
        if content_type.startswith("image/"):
            media_type = models.MediaType.image
        elif content_type.startswith("video/"):
            media_type = models.MediaType.video
        else:
            continue

        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"media/{uuid.uuid4()}{file_extension}"

        try:
            media_url = oss_manager.upload_file_to_oss(file=file, object_name=unique_filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload {file.filename}: {e}")

        db_media = crud.create_media(db=db, owner_id=current_user.id, media_url=media_url, caption=caption,
                                     media_type=media_type)
        if tag_models:
            crud.associate_tags_with_media(db, media=db_media, tags=tag_models)
            db.refresh(db_media)
        created_media_list.append(db_media)

    if not created_media_list:
        raise HTTPException(status_code=400, detail="No valid files were uploaded.")
    return created_media_list


@media_router.get("/{media_id}", response_model=schemas.Media)
def get_media_by_id(media_id: int, db: Session = Depends(database_manager.get_db),
                    current_user: Optional[models.User] = Depends(security.get_optional_current_user)):
    db_media = crud.get_media(db, media_id=media_id)
    if db_media is None: raise HTTPException(status_code=404, detail="Media not found")

    db_media.like_count = crud.get_like_count_for_media(db, media_id=media_id)
    db_media.comment_count = crud.get_comment_count_for_media(db, media_id=media_id)

    is_liked = False
    if current_user:
        like = crud.get_like(db, user_id=current_user.id, media_id=media_id)
        is_liked = bool(like)
    db_media.is_liked_by_current_user = is_liked
    return db_media


@media_router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media_by_user(
        media_id: int,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    media = crud.get_media(db, media_id=media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    if media.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this media")

    oss_manager.delete_file_from_oss(media.media_url)

    crud.delete_media(db, media=media)
    return


@media_router.put("/{media_id}", response_model=schemas.Media)
def update_media_caption(media_id: int, media_update: schemas.MediaUpdate,
                         db: Session = Depends(database_manager.get_db),
                         current_user: models.User = Depends(security.get_current_user)):
    media = crud.get_media(db, media_id=media_id)
    if not media: raise HTTPException(status_code=404, detail="Media not found")
    if media.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this media")
    updated_media = crud.update_media(db, media=media, media_update=media_update)
    # Re-fetch counts for response
    updated_media.like_count = crud.get_like_count_for_media(db, media_id=media_id)
    updated_media.comment_count = crud.get_comment_count_for_media(db, media_id=media_id)
    like = crud.get_like(db, user_id=current_user.id, media_id=media_id)
    updated_media.is_liked_by_current_user = bool(like)
    return updated_media


@media_router.get("/{media_id}/download", response_class=RedirectResponse, status_code=307)
async def download_media(media_id: int, db: Session = Depends(database_manager.get_db),
                         current_user: models.User = Depends(security.get_current_user)):
    media = crud.get_media(db, media_id=media_id)
    if not media: raise HTTPException(status_code=404, detail="Media not found")
    if not media.owner.allow_downloads: raise HTTPException(status_code=403,
                                                            detail="The owner has disabled downloads for this item.")

    db_notification = crud.create_notification(db, recipient_id=media.owner_id, actor_id=current_user.id,
                                               type=models.NotificationType.download, related_entity_id=media.id)
    if db_notification:
        await manager.send_personal_message(schemas.Notification.model_validate(db_notification).model_dump_json(),
                                            db_notification.recipient_id)
    return RedirectResponse(url=media.media_url)


@media_router.post("/{media_id}/comments", response_model=schemas.Comment)
async def post_comment_on_media(media_id: int, comment: schemas.CommentCreate,
                                db: Session = Depends(database_manager.get_db),
                                current_user: models.User = Depends(security.get_current_user)):
    media = crud.get_media(db, media_id=media_id)
    if not media: raise HTTPException(status_code=status.HTTP_404, detail="Media not found")

    db_comment = crud.create_comment(db=db, comment=comment, media_id=media_id, author_id=current_user.id)
    room_name = f"media-{media_id}"
    await manager.broadcast_to_room(room_name, schemas.Comment.model_validate(db_comment).model_dump_json())

    db_notification = crud.create_notification(db, recipient_id=media.owner_id, actor_id=current_user.id,
                                               type=models.NotificationType.comment, related_entity_id=media.id)
    if db_notification:
        await manager.send_personal_message(schemas.Notification.model_validate(db_notification).model_dump_json(),
                                            db_notification.recipient_id)
    return db_comment


@media_router.post("/{media_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def like_media(media_id: int, db: Session = Depends(database_manager.get_db),
                     current_user: models.User = Depends(security.get_current_user)):
    media = crud.get_media(db, media_id=media_id)
    if not media: raise HTTPException(status_code=404, detail="Media not found")
    if crud.get_like(db, user_id=current_user.id, media_id=media_id):
        raise HTTPException(status_code=400, detail="Media already liked")

    crud.create_like(db, user_id=current_user.id, media_id=media_id)
    db_notification = crud.create_notification(db, recipient_id=media.owner_id, actor_id=current_user.id,
                                               type=models.NotificationType.like, related_entity_id=media.id)
    if db_notification:
        await manager.send_personal_message(schemas.Notification.model_validate(db_notification).model_dump_json(),
                                            db_notification.recipient_id)


@media_router.delete("/{media_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_media(media_id: int, db: Session = Depends(database_manager.get_db),
                 current_user: models.User = Depends(security.get_current_user)):
    like_to_delete = crud.get_like(db, user_id=current_user.id, media_id=media_id)
    if not like_to_delete:
        raise HTTPException(status_code=404, detail="Media not liked")
    crud.delete_like(db, like=like_to_delete)


# --- comments ---
@comments_router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_by_user(comment_id: int, db: Session = Depends(database_manager.get_db),
                           current_user: models.User = Depends(security.get_current_user)):
    comment = crud.get_comment(db, comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    crud.delete_comment(db, comment=comment)


# --- ALBUM ENDPOINTS ---
@search_router.get("", response_model=schemas.SearchResults)
def search(q: str = "", db: Session = Depends(database_manager.get_db)):
    if not q:
        return {"users": [], "media": []}
    results = crud.search_content(db, query=q)
    for media_item in results["media"]:
        media_item.like_count = crud.get_like_count_for_media(db, media_id=media_item.id)
        media_item.comment_count = crud.get_comment_count_for_media(db, media_id=media_item.id)
    return results


@albums_router.post("", response_model=schemas.Album)
def create_album(
        album: schemas.AlbumCreate,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    return crud.create_album(db=db, album=album, owner_id=current_user.id)


@albums_router.get("/{album_id}", response_model=schemas.Album)
def get_album(album_id: int, db: Session = Depends(database_manager.get_db)):
    db_album = crud.get_album(db, album_id=album_id)
    if db_album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    return db_album


# --- NEW: Endpoint to delete an album ---
@albums_router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(
        album_id: int,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    """ Allows a user to delete their own album. """
    db_album = crud.get_album(db, album_id=album_id)
    if not db_album:
        raise HTTPException(status_code=404, detail="Album not found")

    # Authorization Check: User must be the owner or an admin
    if db_album.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this album")

    crud.delete_album(db, album=db_album)
    return


@albums_router.post("/{album_id}/media/{media_id}", response_model=schemas.Album)
def add_media_to_album(album_id: int, media_id: int, db: Session = Depends(database_manager.get_db),
                       current_user: models.User = Depends(security.get_current_user)):
    db_album = crud.get_album(db, album_id=album_id)
    if not db_album or db_album.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Album not found or not authorized")
    db_media = crud.get_media(db, media_id=media_id)
    if not db_media:
        raise HTTPException(status_code=404, detail="Media not found")
    return crud.add_media_to_album(db=db, media=db_media, album=db_album)


@albums_router.delete("/{album_id}/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_media_from_album(album_id: int, media_id: int, db: Session = Depends(database_manager.get_db),
                            current_user: models.User = Depends(security.get_current_user)):
    db_album = crud.get_album(db, album_id=album_id)
    if not db_album or db_album.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Album not found or not authorized")
    db_media = crud.get_media(db, media_id=media_id)
    if not db_media: raise HTTPException(status_code=404, detail="Media not found")
    crud.remove_media_from_album(db=db, media=db_media, album=db_album)
    return


@notifications_router.get("", response_model=List[schemas.Notification])
def get_notifications(
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    return crud.get_notifications_for_user(db, user_id=current_user.id)


@notifications_router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_as_read(
        notification_id: int,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    notification = crud.get_notification(db, notification_id=notification_id)
    if not notification or notification.recipient_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    crud.mark_notification_as_read(db, notification=notification)
    return


# --- REPORTS ENPOINTS ---
@reports_router.post("", response_model=schemas.Report)
@limiter.limit("5/hour")
def submit_report(
        request: Request,
        report: schemas.ReportCreate,
        db: Session = Depends(database_manager.get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    if not (report.reported_media_id or report.reported_comment_id):
        raise HTTPException(status_code=400, detail="Must report either a media item or a comment.")
    if report.reported_media_id and report.reported_comment_id:
        raise HTTPException(status_code=400, detail="Cannot report a media item and a comment simultaneously.")
    return crud.create_report(db=db, report=report, reporter_id=current_user.id)


# --- ADMIN-ONLY ENDPOINTS ---
@admin_router.get("/reports", response_model=schemas.PaginatedReports)
def get_all_reports(
        status: Optional[models.ReportStatus] = None,
        skip: int = 0,
        limit: int = 20,
        db: Session = Depends(database_manager.get_db),
        admin_user: models.User = Depends(security.get_current_admin_user)
):
    result = crud.get_reports(db, status=status, skip=skip, limit=limit)
    return result


@admin_router.put("/reports/{report_id}", response_model=schemas.Report)
def action_report(
        report_id: int,
        status_update: schemas.ReportStatusUpdate,
        db: Session = Depends(database_manager.get_db),
        admin_user: models.User = Depends(security.get_current_admin_user)
):
    report = crud.get_report(db, report_id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return crud.update_report_status(db, report=report, status=status_update.status)


@admin_router.post("/media/{media_id}/feature", response_model=schemas.Media)
def toggle_feature_media(media_id: int, db: Session = Depends(database_manager.get_db),
                         admin_user: models.User = Depends(security.get_current_admin_user)):
    media = crud.get_media(db, media_id=media_id)
    if not media: raise HTTPException(status_code=404, detail="Media not found")
    return crud.toggle_media_featured_status(db, media=media)


@admin_router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media_by_admin(
        media_id: int,
        db: Session = Depends(database_manager.get_db),
        admin_user: models.User = Depends(security.get_current_admin_user)
):
    media = crud.get_media(db, media_id=media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    oss_manager.delete_file_from_oss(media.media_url)

    crud.delete_media(db, media=media)
    return


@admin_router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_by_admin(
        comment_id: int,
        db: Session = Depends(database_manager.get_db),
        admin_user: models.User = Depends(security.get_current_admin_user)
):
    comment = crud.get_comment(db, comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    crud.delete_comment(db, comment=comment)
    return


# --- Leaderboard Endpoints ---
@leaderboard_router.get("/media", response_model=List[schemas.Media])  # RENAMED from /media
def get_leaderboard_media(limit: int = 10, db: Session = Depends(database_manager.get_db)):
    results = crud.get_top_liked_media(db=db, limit=limit)
    media_with_counts = []
    for media, like_count, comment_count in results:
        media.like_count = like_count
        media.comment_count = comment_count
        media_with_counts.append(media)
    return media_with_counts


@leaderboard_router.get("/users", response_model=List[schemas.User])
def get_leaderboard_users(limit: int = 10, db: Session = Depends(database_manager.get_db)):
    """ Gets the top N most followed users. """
    results = crud.get_most_followed_users(db=db, limit=limit)
    user_list = []
    for user, followers_count in results:
        user.followers_count = followers_count
        user.following_count = crud.get_following_count_for_user(db, user_id=user.id)
        user_list.append(user)
    return user_list


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(media_router)
app.include_router(comments_router)
app.include_router(search_router)
app.include_router(albums_router)
app.include_router(notifications_router)
app.include_router(reports_router)
app.include_router(admin_router)
app.include_router(leaderboard_router)
