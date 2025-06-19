# C:/Users/kcfle/Documents/React Projects/grad-app/backend/schemas.py

from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from models import NotificationType, ReportStatus

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

# --- Image Schemas ---

class ImageBase(BaseModel):
    caption: Optional[str] = None

class ImageCreate(ImageBase):
    pass

class ImageUpdate(ImageBase):
    pass

class Image(ImageBase, BaseSchema):
    id: int
    owner_id: int
    image_url: str
    is_featured: bool
    created_at: datetime
    owner: UserSimple
    tags: List[Tag] = []
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
    images: List['Image'] = []

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
    images: List[Image] = []
    albums: List['Album'] = []
    followers_count: int = 0
    following_count: int = 0
    is_followed_by_current_user: bool = False
    is_admin: bool


# --- Interaction Schemas (Likes, Comments, Follows) ---

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase, BaseSchema):
    id: int
    image_id: int
    created_at: datetime
    author: UserSimple

class Like(BaseSchema):
    user_id: int
    image_id: int
    user: UserSimple

class Follow(BaseSchema):
    follower_id: int
    following_id: int
    created_at: datetime

# --- Notification and Report Schemas (Primarily for Reading) ---

class Notification(BaseSchema):
    id: int
    type: NotificationType
    is_read: bool
    created_at: datetime
    actor: UserSimple
    related_entity_id: Optional[int] = None

class ReportBase(BaseModel):
    reason: Optional[str] = None

class ReportCreate(ReportBase):
    reported_image_id: Optional[int] = None
    reported_comment_id: Optional[int] = None

class Report(ReportBase, BaseSchema):
    id: int
    status: ReportStatus
    reporter: UserSimple
    reported_image_id: Optional[int] = None
    reported_comment_id: Optional[int] = None
    created_at: datetime

# --- Authentication Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# --- Search Schemas ---
class SearchResults(BaseModel):
    users: List[UserSimple]
    photos: List[Image]

# --- Rebuild Models with Forward References ---
Album.model_rebuild()
User.model_rebuild()