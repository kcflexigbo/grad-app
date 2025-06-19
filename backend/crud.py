# C:/Users/kcfle/Documents/React Projects/grad-app/backend/crud.py
from typing import List

from sqlalchemy.orm import Session, contains_eager
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
    """Retrieves a single user by their username."""
    return db.query(models.User).filter(models.User.username == username).first()


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
    print("me called")
    return db.query(models.Album).filter(models.Album.owner_id == user_id).all()


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


# --- Image CRUD Functions ---

def get_image(db: Session, image_id: int):
    """Retrieves a single image by its ID."""
    return db.query(models.Image).filter(models.Image.id == image_id).first()


def get_images(db: Session, sort_by: str = "newest", skip: int = 0, limit: int = 20):
    """
    Retrieves a paginated list of all images, with different sorting options,
    and pre-calculates like and comment counts in a single query to avoid the N+1 problem.
    """
    comment_count_subquery = (
        db.query(
            models.Comment.image_id,
            func.count(models.Comment.id).label("comment_count")
        )
        .group_by(models.Comment.image_id)
        .subquery()
    )

    like_count_subquery = (
        db.query(
            models.Like.image_id,
            func.count(models.Like.user_id).label("like_count")
        )
        .group_by(models.Like.image_id)
        .subquery()
    )

    query = (
        db.query(
            models.Image,
            func.coalesce(like_count_subquery.c.like_count, 0).label("like_count"),
            func.coalesce(comment_count_subquery.c.comment_count, 0).label("comment_count")
        )
        .outerjoin(like_count_subquery, models.Image.id == like_count_subquery.c.image_id)
        .outerjoin(comment_count_subquery, models.Image.id == comment_count_subquery.c.image_id)
    )

    if sort_by == "popular":
        query = query.order_by(func.coalesce(like_count_subquery.c.like_count, 0).desc())
    elif sort_by == "featured":
        query = query.filter(models.Image.is_featured == True).order_by(
            models.Image.created_at.desc()
        )
    else:
        query = query.order_by(models.Image.created_at.desc())

    return query.offset(skip).limit(limit).all()


def create_image(db: Session, owner_id: int, image_url: str, caption: str):
    """Creates a new image record in the database."""
    db_image = models.Image(
        owner_id=owner_id,
        image_url=image_url,
        caption=caption
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


def delete_image(db: Session, image: models.Image):
    """Deletes an image from the database."""
    db.delete(image)
    db.commit()
    return True

def update_image(db: Session, image: models.Image, image_update: schemas.ImageUpdate) -> models.Image:
    """Updates an image's data based on the provided schema."""
    # model_dump(exclude_unset=True) ensures we only update fields that were actually sent
    update_data = image_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(image, key, value)
    db.commit()
    db.refresh(image)
    return image

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


def associate_tags_with_image(db: Session, image: models.Image, tags: list[models.Tag]):
    """Associates a list of Tag models with an Image model."""
    image.tags.extend(tag for tag in tags if tag not in image.tags)
    db.commit()


# --- Comment CRUD Functions ---

def create_comment(db: Session, comment: schemas.CommentCreate, image_id: int, author_id: int):
    """Creates a new comment on an image."""
    db_comment = models.Comment(
        **comment.model_dump(),
        image_id=image_id,
        author_id=author_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def get_comments_for_image(db: Session, image_id: int, skip: int = 0, limit: int = 50):
    """Retrieves comments for a specific image."""
    return (db.query(models.Comment).filter(models.Comment.image_id == image_id).
            order_by(models.Comment.created_at.asc()).offset(skip).limit(limit).all())


def get_comment_count_for_image(db: Session, image_id: int) -> int:
    """Gets the total number of comments for an image."""
    return db.query(models.Comment).filter(models.Comment.image_id == image_id).count()


# --- Like CRUD Functions ---

def get_like(db: Session, user_id: int, image_id: int):
    """Checks if a specific like exists."""
    return db.query(models.Like).filter(models.Like.user_id == user_id,
                                        models.Like.image_id == image_id).first()


def create_like(db: Session, user_id: int, image_id: int):
    """Creates a like record."""
    db_like = models.Like(user_id=user_id, image_id=image_id)
    db.add(db_like)
    db.commit()
    db.refresh(db_like)
    return db_like


def delete_like(db: Session, like: models.Like):
    """Deletes a like record."""
    db.delete(like)
    db.commit()
    return True


def get_like_count_for_image(db: Session, image_id: int) -> int:
    """Gets the total number of likes for an image."""
    return db.query(models.Like).filter(models.Like.image_id == image_id).count()


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


def create_notification(db: Session, recipient_id: int, actor_id: int, type: models.NotificationType, related_entity_id: int):
    """Creates a notification for a user action."""
    # Avoid creating a notification if a user interacts with their own content
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

def get_follower_count_for_user(db: Session, user_id: int) -> int:
    """Gets the number of followers a user has."""
    return db.query(models.Follow).filter(models.Follow.following_id == user_id).count()


def get_following_count_for_user(db: Session, user_id: int) -> int:
    """Gets the number of users a user is following."""
    return db.query(models.Follow).filter(models.Follow.follower_id == user_id).count()


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


# --- NEW: Function to delete an album ---
def delete_album(db: Session, album: models.Album):
    """Deletes an album from the database."""
    db.delete(album)
    db.commit()
    return True


def add_image_to_album(db: Session, image: models.Image, album: models.Album):
    """Adds an image to an album if it's not already there."""
    if image not in album.images:
        album.images.append(image)
        db.commit()
    return album

def remove_image_from_album(db: Session, image: models.Image, album: models.Album):
    """Removes an image from an album if it is present."""
    if image in album.images:
        album.images.remove(image)
        db.commit()
    return album

# --- NEW SEARCH FUNCTION ---

def search_content(db: Session, query: str, limit: int = 20):
    """
    Searches for users by username and photos by caption or tag.
    """
    search_term = f"%{query.lower()}%"

    users = (
        db.query(models.User)
        .filter(models.User.username.ilike(search_term))
        .limit(limit)
        .all()
    )

    photos = (
        db.query(models.Image)
        .outerjoin(models.Image.tags)
        .filter(
            or_(
                models.Image.caption.ilike(search_term),
                models.Tag.name.ilike(search_term)
            )
        )
        .distinct(models.Image.id)
        .limit(limit)
        .all()
    )

    return {"users": users, "photos": photos}

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


def get_reports(db: Session, skip: int = 0, limit: int = 100) -> List[models.Report]:
    """Retrieves a list of all reports, newest first."""
    return db.query(models.Report).order_by(models.Report.created_at.desc()).offset(skip).limit(limit).all()


def get_report(db: Session, report_id: int) -> models.Report:
    """Retrieves a single report by its ID."""
    return db.query(models.Report).filter(models.Report.id == report_id).first()


def update_report_status(db: Session, report: models.Report, status: models.ReportStatus) -> models.Report:
    """Updates the status of a report."""
    report.status = status
    db.commit()
    db.refresh(report)
    return report


def toggle_image_featured_status(db: Session, image: models.Image) -> models.Image:
    """Flips the 'is_featured' boolean on an image."""
    image.is_featured = not image.is_featured
    db.commit()
    db.refresh(image)
    return image


def get_comment(db: Session, comment_id: int) -> models.Comment:
    """Retrieves a single comment by its ID."""
    return db.query(models.Comment).filter(models.Comment.id == comment_id).first()


def delete_comment(db: Session, comment: models.Comment):
    """Deletes a comment from the database."""
    db.delete(comment)
    db.commit()
    return True