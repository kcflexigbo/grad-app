from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session, contains_eager, selectinload
from sqlalchemy import func, or_
import schemas, security, models


# --- User CRUD Functions ---

def get_user(db: Session, user_id: int):
    """Retrieves a single user by their ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    """Retrieves a single user by their email."""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str):
    """Retrieves a single user by their username, preloading related data."""
    return (
        db.query(models.User)
        .options(
            selectinload(models.User.media).options(selectinload(models.Media.tags)),
            selectinload(models.User.albums)
        )
        .filter(models.User.username == username)
        .first()
    )


def get_users(db: Session, skip: int = 0, limit: int = 100):
    """Retrieves a paginated list of users."""
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    """Creates a new user in the database."""
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=str(user.email),
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_albums(db: Session, user_id: int) -> List[models.Album]:
    """Retrieves all albums owned by a specific user."""
    return db.query(models.Album).filter(models.Album.owner_id == user_id).all()


# --- Leaderboard CRUD Functions ---

def get_top_liked_media(db: Session, limit: int = 10):
    """
    Retrieves a list of the most liked media (media and videos).
    """
    comment_count_subquery = (
        db.query(
            models.Comment.media_id,
            func.count(models.Comment.id).label("comment_count")
        )
        .group_by(models.Comment.media_id)
        .subquery()
    )

    like_count_subquery = (
        db.query(
            models.Like.media_id,
            func.count(models.Like.user_id).label("like_count")
        )
        .group_by(models.Like.media_id)
        .subquery()
    )

    query = (
        db.query(
            models.Media,
            func.coalesce(like_count_subquery.c.like_count, 0).label("like_count"),
            func.coalesce(comment_count_subquery.c.comment_count, 0).label("comment_count")
        )
        .outerjoin(like_count_subquery, models.Media.id == like_count_subquery.c.media_id)
        .outerjoin(comment_count_subquery, models.Media.id == comment_count_subquery.c.media_id)
        .order_by(func.coalesce(like_count_subquery.c.like_count, 0).desc())
    )

    return query.limit(limit).all()


def get_most_followed_users(db: Session, limit: int = 10):
    """
    Retrieves a list of the most followed users. (Unchanged)
    """
    return (
        db.query(
            models.User,
            func.count(models.Follow.follower_id).label("followers_count")
        )
        .outerjoin(models.Follow, models.User.id == models.Follow.following_id)
        .group_by(models.User.id)
        .order_by(func.count(models.Follow.follower_id).desc())
        .limit(limit)
        .all()
    )


def get_user_followers(db: Session, user_id: int) -> List[models.User]:
    """Retrieves a list of users who follow the given user."""
    return db.query(models.User).join(models.Follow, models.User.id == models.Follow.follower_id).filter(
        models.Follow.following_id == user_id).all()


def get_user_following(db: Session, user_id: int) -> List[models.User]:
    """Retrieves a list of users the given user is following."""
    return db.query(models.User).join(models.Follow, models.User.id == models.Follow.following_id).filter(
        models.Follow.follower_id == user_id).all()


def update_user(db: Session, db_user: models.User, user_update: schemas.UserUpdate):
    """Updates a user's profile information."""
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_password(db: Session, user: models.User, new_password: str):
    """Hashes and updates a user's password."""
    user.hashed_password = security.get_password_hash(new_password)
    db.commit()
    return user


# --- Media CRUD Functions (Previously Media CRUD) ---

def get_media(db: Session, media_id: int):
    """Retrieves a single media item by its ID."""
    return db.query(models.Media).filter(models.Media.id == media_id).first()


def get_all_media(db: Session, sort_by: str = "newest", skip: int = 0, limit: int = 20):
    """
    Retrieves a paginated list of all media, with sorting options,
    and pre-calculates like and comment counts.
    """
    comment_count_subquery = (
        db.query(
            models.Comment.media_id,
            func.count(models.Comment.id).label("comment_count")
        )
        .group_by(models.Comment.media_id)
        .subquery()
    )

    like_count_subquery = (
        db.query(
            models.Like.media_id,
            func.count(models.Like.user_id).label("like_count")
        )
        .group_by(models.Like.media_id)
        .subquery()
    )

    query = (
        db.query(
            models.Media,
            func.coalesce(like_count_subquery.c.like_count, 0).label("like_count"),
            func.coalesce(comment_count_subquery.c.comment_count, 0).label("comment_count")
        )
        .outerjoin(like_count_subquery, models.Media.id == like_count_subquery.c.media_id)
        .outerjoin(comment_count_subquery, models.Media.id == comment_count_subquery.c.media_id)
    )

    if sort_by == "popular":
        query = query.order_by(func.coalesce(like_count_subquery.c.like_count, 0).desc())
    elif sort_by == "featured":
        query = query.filter(models.Media.is_featured == True).order_by(
            models.Media.created_at.desc()
        )
    else:
        query = query.order_by(models.Media.created_at.desc())

    return query.offset(skip).limit(limit).all()


def create_media(db: Session, owner_id: int, media_url: str, caption: str, media_type: models.MediaType):
    """Creates a new media record in the database."""
    db_media = models.Media(
        owner_id=owner_id,
        media_url=media_url,
        caption=caption,
        media_type=media_type
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media


def delete_media(db: Session, media: models.Media):
    """Deletes a media item from the database."""
    db.delete(media)
    db.commit()
    return True


def update_media(db: Session, media: models.Media, media_update: schemas.MediaUpdate) -> models.Media:
    """Updates a media item's data based on the provided schema."""
    update_data = media_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(media, key, value)
    db.commit()
    db.refresh(media)
    return media


# --- Tag CRUD Functions ---

def get_tag_by_name(db: Session, tag_name: str):
    """Retrieves a single tag by its name."""
    return db.query(models.Tag).filter(models.Tag.name == tag_name).first()


def get_or_create_tags(db: Session, tags: list[str]) -> list[models.Tag]:
    """For a list of tag names, retrieves existing tags or creates new ones."""
    tag_models = []
    tags_to_create = []
    for tag_name in set(t.strip().lower() for t in tags if t.strip()):
        db_tag = get_tag_by_name(db, tag_name)
        if db_tag:
            tag_models.append(db_tag)
        else:
            tags_to_create.append(models.Tag(name=tag_name))

    if tags_to_create:
        db.add_all(tags_to_create)
        db.commit()
        tag_models.extend(tags_to_create)

    return tag_models


def associate_tags_with_media(db: Session, media: models.Media, tags: list[models.Tag]):
    """Associates a list of Tag models with a Media model."""
    media.tags.extend(tag for tag in tags if tag not in media.tags)
    db.commit()


# --- Comment CRUD Functions ---

def create_comment(db: Session, comment: schemas.CommentCreate, media_id: int, author_id: int):
    """Creates a new comment on a media item."""
    db_comment = models.Comment(
        **comment.model_dump(),
        media_id=media_id,
        author_id=author_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def get_comments_for_media(db: Session, media_id: int, skip: int = 0, limit: int = 50):
    """Retrieves comments for a specific media item."""
    return (db.query(models.Comment).filter(models.Comment.media_id == media_id).
            order_by(models.Comment.created_at.asc()).offset(skip).limit(limit).all())


def get_comment_count_for_media(db: Session, media_id: int) -> int:
    """Gets the total number of comments for a media item."""
    return db.query(models.Comment).filter(models.Comment.media_id == media_id).count()


# --- Like CRUD Functions ---

def get_like(db: Session, user_id: int, media_id: int):
    """Checks if a specific like exists."""
    return db.query(models.Like).filter(models.Like.user_id == user_id,
                                        models.Like.media_id == media_id).first()


def create_like(db: Session, user_id: int, media_id: int):
    """Creates a like record."""
    db_like = models.Like(user_id=user_id, media_id=media_id)
    db.add(db_like)
    db.commit()
    db.refresh(db_like)
    return db_like


def delete_like(db: Session, like: models.Like):
    """Deletes a like record."""
    db.delete(like)
    db.commit()
    return True


def get_like_count_for_media(db: Session, media_id: int) -> int:
    """Gets the total number of likes for a media item."""
    return db.query(models.Like).filter(models.Like.media_id == media_id).count()



# --- Follow CRUD Functions ---

def get_follow(db: Session, follower_id: int, following_id: int):
    """Checks if a follow relationship exists."""
    return db.query(models.Follow).filter(models.Follow.follower_id == follower_id,
                                          models.Follow.following_id == following_id).first()


def create_follow(db: Session, follower_id: int, following_id: int):
    """Creates a follow relationship."""
    db_follow = models.Follow(follower_id=follower_id, following_id=following_id)
    db.add(db_follow)
    db.commit()
    db.refresh(db_follow)
    return db_follow


def delete_follow(db: Session, follow: models.Follow):
    """Deletes a follow relationship."""
    db.delete(follow)
    db.commit()
    return True

def get_follower_count_for_user(db: Session, user_id: int) -> int:
    """Gets the number of followers a user has."""
    return db.query(models.Follow).filter(models.Follow.following_id == user_id).count()


def get_following_count_for_user(db: Session, user_id: int) -> int:
    """Gets the number of users a user is following."""
    return db.query(models.Follow).filter(models.Follow.follower_id == user_id).count()

# --- Notification CRUD Functions  ---
def create_notification(db: Session, recipient_id: int, actor_id: int, type: models.NotificationType,
                        related_entity_id: int):
    """Creates a notification for a user action."""
    if recipient_id == actor_id:
        return None

    db_notification = models.Notification(
        recipient_id=recipient_id,
        actor_id=actor_id,
        type=type,
        related_entity_id=related_entity_id
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

# --- Album CRUD Functions ---

def create_album(db: Session, album: schemas.AlbumCreate, owner_id: int):
    """Creates a new album for a user."""
    db_album = models.Album(**album.model_dump(), owner_id=owner_id)
    db.add(db_album)
    db.commit()
    db.refresh(db_album)
    return db_album


def get_album(db: Session, album_id: int):
    """Retrieves a single album by its ID."""
    return db.query(models.Album).filter(models.Album.id == album_id).first()


def delete_album(db: Session, album: models.Album):
    """Deletes an album from the database."""
    db.delete(album)
    db.commit()
    return True


def add_media_to_album(db: Session, media: models.Media, album: models.Album):
    """Adds a media item to an album if it's not already there."""
    if media not in album.media:
        album.media.append(media)
        db.commit()
    return album


def remove_media_from_album(db: Session, media: models.Media, album: models.Album):
    """Removes a media item from an album if it is present."""
    if media in album.media:
        album.media.remove(media)
        db.commit()
    return album


# --- NEW SEARCH FUNCTION ---

def search_content(db: Session, query: str, limit: int = 20):
    """
    Searches for users by username and media by caption or tag.
    """
    search_term = f"%{query.lower()}%"

    users = (
        db.query(models.User)
        .filter(models.User.username.ilike(search_term))
        .limit(limit)
        .all()
    )

    media_items = (
        db.query(models.Media)
        .outerjoin(models.Media.tags)
        .filter(
            or_(
                models.Media.caption.ilike(search_term),
                models.Tag.name.ilike(search_term)
            )
        )
        .distinct(models.Media.id)
        .limit(limit)
        .all()
    )

    return {"users": users, "media": media_items}


def get_notification(db: Session, notification_id: int):
    """Retrieves a single notification by its ID."""
    return db.query(models.Notification).filter(models.Notification.id == notification_id).first()


def get_notifications_for_user(db: Session, user_id: int, limit: int = 50):
    """Retrieves a paginated list of notifications for a user."""
    return (
        db.query(models.Notification)
        .filter(models.Notification.recipient_id == user_id)
        .order_by(models.Notification.created_at.desc())
        .limit(limit)
        .all()
    )


def mark_notification_as_read(db: Session, notification: models.Notification):
    """Marks a single notification as read."""
    notification.is_read = True
    db.commit()
    return notification


# --- NEW REPORTING AND ADMIN CRUD FUNCTIONS ---

def create_report(db: Session, report: schemas.ReportCreate, reporter_id: int) -> models.Report:
    """Creates a new content report in the database."""
    db_report = models.Report(**report.model_dump(), reporter_id=reporter_id)
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def get_reports(db: Session, status: Optional[models.ReportStatus] = None, skip: int = 0, limit: int = 100) -> Dict[
    str, Any]:
    """Retrieves a list of reports, with optional status filtering and pagination."""
    query = db.query(models.Report)

    if status:
        query = query.filter(models.Report.status == status)

    total_count = query.count()

    reports = (
        query.order_by(models.Report.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {"reports": reports, "total_count": total_count}


def get_report(db: Session, report_id: int) -> models.Report:
    """Retrieves a single report by its ID."""
    return db.query(models.Report).filter(models.Report.id == report_id).first()


def update_report_status(db: Session, report: models.Report, status: models.ReportStatus) -> models.Report:
    """Updates the status of a report."""
    report.status = status
    db.commit()
    db.refresh(report)
    return report


def toggle_media_featured_status(db: Session, media: models.Media) -> models.Media:
    """Flips the 'is_featured' boolean on a media item."""
    media.is_featured = not media.is_featured
    db.commit()
    db.refresh(media)
    return media


def get_comment(db: Session, comment_id: int) -> models.Comment:
    """Retrieves a single comment by its ID."""
    return db.query(models.Comment).filter(models.Comment.id == comment_id).first()


def delete_comment(db: Session, comment: models.Comment):
    """Deletes a comment from the database."""
    db.delete(comment)
    db.commit()
    return True