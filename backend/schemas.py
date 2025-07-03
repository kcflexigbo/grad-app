# C:/Users/kcfle/Documents/React Projects/grad-app/frontend/src/schemas.py

from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from models import NotificationType, ReportStatus, MediaType  # Import MediaType


# --- Configuration ---
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True


# --- Base and Simple Schemas (for nesting) ---

class UserSimple(BaseSchema):
    id: int
    username: str
    profile_picture_url: Optional[str] = None


class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class Tag(TagBase, BaseSchema):
    id: int


# --- Interaction Schemas (Likes, Comments, Follows) ---

class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class Comment(CommentBase, BaseSchema):
    id: int
    media_id: int  # RENAMED from image_id
    created_at: datetime
    author: UserSimple


class Like(BaseSchema):
    user_id: int
    media_id: int  # RENAMED from image_id
    user: UserSimple


class Follow(BaseSchema):
    follower_id: int
    following_id: int
    created_at: datetime


# --- Media Schemas (Previously Media Schemas) ---

class MediaBase(BaseModel):
    caption: Optional[str] = None


class MediaCreate(MediaBase):
    pass


class MediaUpdate(MediaBase):
    pass


class Media(MediaBase, BaseSchema):
    id: int
    owner_id: int
    media_url: str  # RENAMED from image_url
    media_type: MediaType  # NEW field
    is_featured: bool
    created_at: datetime
    owner: UserSimple
    tags: List[Tag] = []
    # `comments` list removed for brevity, often fetched separately
    like_count: int = 0
    comment_count: int = 0
    is_liked_by_current_user: bool = False


# --- Album Schemas ---

class AlbumBase(BaseModel):
    name: str
    description: Optional[str] = None


class AlbumCreate(AlbumBase):
    pass


class AlbumUpdate(AlbumBase):
    name: Optional[str] = None
    description: Optional[str] = None


class Album(AlbumBase, BaseSchema):
    id: int
    owner_id: int
    owner: UserSimple
    media: List['Media'] = []  # RENAMED from media


class AlbumWithMediaCount(AlbumBase, BaseSchema):
    id: int
    owner: UserSimple
    media_count: int = 0  # RENAMED from image_count


# --- User Schemas ---

class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    allow_downloads: Optional[bool] = None


class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str


class User(UserBase, BaseSchema):
    id: int
    email: EmailStr
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    allow_downloads: bool
    created_at: datetime
    media: List[Media] = []  # RENAMED from media
    albums: List['Album'] = []
    followers_count: int = 0
    following_count: int = 0
    is_followed_by_current_user: bool = False
    is_admin: bool


class UserProfile(User, BaseSchema):
    albums: List[AlbumWithMediaCount] = []


# --- Notification and Report Schemas ---

class Notification(BaseSchema):
    id: int
    type: NotificationType
    is_read: bool
    created_at: datetime
    actor: UserSimple
    related_entity_id: Optional[int] = None # Refers to media.id for like/comment


class ReportBase(BaseModel):
    reason: Optional[str] = None


class ReportCreate(ReportBase):
    reported_media_id: Optional[int] = None  # RENAMED
    reported_comment_id: Optional[int] = None


class ReportStatusUpdate(BaseModel):
    status: ReportStatus


class Report(ReportBase, BaseSchema):
    id: int
    status: ReportStatus
    reporter: UserSimple
    reported_media_id: Optional[int] = None  # RENAMED
    reported_comment_id: Optional[int] = None
    created_at: datetime


class PaginatedReports(BaseModel):
    reports: List[Report]
    total_count: int


# --- Authentication Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# --- Search Schemas ---
class SearchResults(BaseModel):
    users: List[UserSimple]
    media: List[Media]  # RENAMED from media


class UserWithFollowStatus(UserSimple):
    is_followed_by_current_user: bool = False

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --- Rebuild Models with Forward References ---
Album.model_rebuild()
User.model_rebuild()
UserProfile.model_rebuild()