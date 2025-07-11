from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Table, Enum as PyEnum
)
from sqlalchemy.orm import relationship, declarative_base, column_property
from sqlalchemy.sql import func, select
import enum
from database_manager import Base


# --- NEW: Enum to distinguish between media types ---
class MediaType(enum.Enum):
    image = 'image'
    video = 'video'


class NotificationType(enum.Enum):
    like = 'like'
    comment = 'comment'
    follow = 'follow'
    download = 'download'
    chat_message = 'chat_message'


class ReportStatus(enum.Enum):
    pending = 'pending'
    resolved = 'resolved'
    dismissed = 'dismissed'


# --- RENAMED: from image_tags to media_tags ---
media_tags = Table('media_tags', Base.metadata,
                   Column('media_id', Integer, ForeignKey('media.id', ondelete="CASCADE"), primary_key=True),
                   Column('tag_id', Integer, ForeignKey('tags.id', ondelete="CASCADE"), primary_key=True)
                   )

# --- RENAMED: from image_albums to media_albums ---
media_albums = Table('media_albums', Base.metadata,
                     Column('media_id', Integer, ForeignKey('media.id', ondelete="CASCADE"), primary_key=True),
                     Column('album_id', Integer, ForeignKey('albums.id', ondelete="CASCADE"), primary_key=True)
                     )

conversation_participants = Table('conversation_participants', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('conversation_id', Integer, ForeignKey('conversations.id', ondelete="CASCADE"), primary_key=True)
)


# --- REORDERED: Define dependent models first ---

class Follow(Base):
    __tablename__ = "follows"
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    followed_by = relationship("User", foreign_keys=[following_id], back_populates="followers")

class Like(Base):
    __tablename__ = "likes"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="likes")
    media_item = relationship("Media", back_populates="likes")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    author = relationship("User", back_populates="comments")
    media_item = relationship("Media", back_populates="comments")
    reports = relationship("Report", back_populates="reported_comment", cascade="all, delete-orphan")


# --- Main models that have dependencies ---

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

    # This now correctly references the 'Follow' class defined above
    followers_count = column_property(
        select(func.count(Follow.follower_id))
        .where(Follow.following_id == id)
        .correlate_except(Follow)
        .scalar_subquery()
    )
    # This now correctly references the 'Follow' class defined above
    following_count = column_property(
        select(func.count(Follow.following_id))
        .where(Follow.follower_id == id)
        .correlate_except(Follow)
        .scalar_subquery()
    )

    media = relationship("Media", back_populates="owner", cascade="all, delete-orphan")
    albums = relationship("Album", back_populates="owner", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    reports_made = relationship("Report", foreign_keys="[Report.reporter_id]", back_populates="reporter",
                                cascade="all, delete-orphan")
    notifications_received = relationship("Notification", foreign_keys="[Notification.recipient_id]",
                                          back_populates="recipient", cascade="all, delete-orphan")
    actions_caused = relationship("Notification", foreign_keys="[Notification.actor_id]", back_populates="actor",
                                  cascade="all, delete-orphan")
    following = relationship("Follow", foreign_keys="[Follow.follower_id]", back_populates="follower",
                             cascade="all, delete-orphan")
    followers = relationship("Follow", foreign_keys="[Follow.following_id]", back_populates="followed_by",
                             cascade="all, delete-orphan")
    sent_messages = relationship("Message", back_populates="sender", cascade="all, delete-orphan")
    conversations = relationship("Conversation", secondary=conversation_participants, back_populates="participants")


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    media_url = Column(String(255), nullable=False)
    media_type = Column(PyEnum(MediaType), nullable=False, default=MediaType.image)
    caption = Column(Text, nullable=True)
    is_featured = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # This now correctly references the 'Like' class defined above
    like_count = column_property(
        select(func.count(Like.user_id))
        .where(Like.media_id == id)
        .correlate_except(Like)
        .scalar_subquery()
    )
    # This now correctly references the 'Comment' class defined above
    comment_count = column_property(
        select(func.count(Comment.id))
        .where(Comment.media_id == id)
        .correlate_except(Comment)
        .scalar_subquery()
    )

    owner = relationship("User", back_populates="media")
    comments = relationship("Comment", back_populates="media_item", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="media_item", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="reported_media", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=media_tags, back_populates="media")
    albums = relationship("Album", secondary=media_albums, back_populates="media")


# --- The rest of the models can stay in their original order ---

class Album(Base):
    __tablename__ = "albums"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="albums")
    media = relationship("Media", secondary=media_albums, back_populates="albums")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)

    media = relationship("Media", secondary=media_tags, back_populates="tags")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(PyEnum(NotificationType), nullable=False)
    related_entity_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="notifications_received")
    actor = relationship("User", foreign_keys=[actor_id], back_populates="actions_caused")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    reported_media_id = Column(Integer, ForeignKey("media.id", ondelete="CASCADE"), nullable=True)
    reported_comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(PyEnum(ReportStatus), nullable=False, default=ReportStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reporter = relationship("User", back_populates="reports_made")
    reported_media = relationship("Media", back_populates="reports")
    reported_comment = relationship("Comment", back_populates="reports")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")


class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(PyEnum(enum.Enum('ConversationType', {'one_to_one': 'one_to_one', 'group': 'group'}),
                         name='conversation_type_enum'), nullable=False, default='one_to_one')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    participants = relationship("User", secondary=conversation_participants, back_populates="conversations")
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="desc(Message.created_at)"
    )


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")