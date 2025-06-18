from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# In a real project, these enums should be imported from your models file
# to ensure they are the same. For this example, we'll redefine them.
import enum
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
    pass # image_url will be set in the backend after upload

class ImageUpdate(ImageBase):
    pass

class Image(ImageBase, BaseSchema):
    id: int
    owner_id: int
    image_url: str
    is_featured: bool
    created_at: datetime
    owner: UserSimple  # Nested simple user schema
    tags: List[Tag] = []
    # like_count: Optional[int] # Can be added later


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
    images: List['Image'] = [] # Forward reference to Image


class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    allow_downloads: Optional[bool] = None

class User(UserBase, BaseSchema):
    id: int
    email: EmailStr
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    allow_downloads: bool
    created_at: datetime
    images: List[Image] = []
    albums: List['Album'] = [] # Forward reference to Album
    is_followed_by_current_user: bool = False  # Default to False
    # followers_count: Optional[int]
    # following_count: Optional[int]


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
    # User must report either an image or a comment
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


# --- Rebuild Models with Forward References ---
# This is the modern replacement for update_forward_refs in Pydantic V2.
# It resolves the string-based type hints ('Image', 'Album') after all
# models have been defined in the module.

Album.model_rebuild()
User.model_rebuild()