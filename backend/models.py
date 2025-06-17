from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Table, Enum as PyEnum
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum
from database_manager import Base

class NotificationType(enum.Enum):
    like = 'like'
    comment = 'comment'
    follow = 'follow'
    download = 'download'


class ReportStatus(enum.Enum):
    pending = 'pending'
    resolved = 'resolved'
    dismissed = 'dismissed'

image_tags = Table('image_tags', Base.metadata,
                   Column('image_id', Integer, ForeignKey('images.id', ondelete="CASCADE"), primary_key=True),
                   Column('tag_id', Integer, ForeignKey('tags.id', ondelete="CASCADE"), primary_key=True)
                   )

image_albums = Table('image_albums', Base.metadata,
                     Column('image_id', Integer, ForeignKey('images.id', ondelete="CASCADE"), primary_key=True),
                     Column('album_id', Integer, ForeignKey('albums.id', ondelete="CASCADE"), primary_key=True)
                     )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    profile_picture_url = Column(String(255), nullable=True)
    allow_downloads = Column(Boolean, nullable=False, default=True)
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships: A user has many...
    images = relationship("Image", back_populates="owner", cascade="all, delete-orphan")
    albums = relationship("Album", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    reports_made = relationship("Report", foreign_keys="[Report.reporter_id]", back_populates="reporter",
                                cascade="all, delete-orphan")
    notifications_received = relationship("Notification", foreign_keys="[Notification.recipient_id]",
                                          back_populates="recipient", cascade="all, delete-orphan")
    actions_caused = relationship("Notification", foreign_keys="[Notification.actor_id]", back_populates="actor",
                                  cascade="all, delete-orphan")

    # Many-to-many relationship for follows
    following = relationship("Follow", foreign_keys="[Follow.follower_id]", back_populates="follower",
                             cascade="all, delete-orphan")
    followers = relationship("Follow", foreign_keys="[Follow.following_id]", back_populates="followed_by",
                             cascade="all, delete-orphan")


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(255), nullable=False)
    caption = Column(Text, nullable=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships: An image has one owner, and many...
    owner = relationship("User", back_populates="images")
    comments = relationship("Comment", back_populates="image", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="image", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="reported_image", cascade="all, delete-orphan")

    # Many-to-many relationships
    tags = relationship("Tag", secondary=image_tags, back_populates="images")
    albums = relationship("Album", secondary=image_albums, back_populates="images")


class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="albums")
    images = relationship("Image", secondary=image_albums, back_populates="albums")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)

    # Relationship
    images = relationship("Image", secondary=image_tags, back_populates="tags")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    author = relationship("User", back_populates="comments")
    image = relationship("Image", back_populates="comments")
    reports = relationship("Report", back_populates="reported_comment", cascade="all, delete-orphan")


# --- Association Object Models ---
# These are linking tables that contain extra data (like timestamps),
# so we model them as full classes instead of using the `Table` construct.

class Like(Base):
    __tablename__ = "likes"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="likes")
    image = relationship("Image", back_populates="likes")


class Follow(Base):
    __tablename__ = "follows"

    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    followed_by = relationship("User", foreign_keys=[following_id], back_populates="followers")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(PyEnum(NotificationType), nullable=False)
    related_entity_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="notifications_received")
    actor = relationship("User", foreign_keys=[actor_id], back_populates="actions_caused")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=True)
    reported_comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(PyEnum(ReportStatus), nullable=False, default=ReportStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    reporter = relationship("User", back_populates="reports_made")
    reported_image = relationship("Image", back_populates="reports")
    reported_comment = relationship("Comment", back_populates="reports")