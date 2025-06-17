from sqlalchemy.orm import Session
import schemas, security, models


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


def update_user(db: Session, db_user: models.User, user_update: schemas.UserUpdate):
    """Updates a user's profile information."""
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


# --- Image CRUD Functions ---

def get_image(db: Session, image_id: int):
    """Retrieves a single image by its ID."""
    return db.query(models.Image).filter(models.Image.id == image_id).first()


def get_images(db: Session, skip: int = 0, limit: int = 20):
    """Retrieves a paginated list of all images, newest first."""
    return db.query(models.Image).order_by(models.Image.created_at.desc()).offset(skip).limit(limit).all()


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


# --- Tag CRUD Functions ---

def get_tag_by_name(db: Session, tag_name: str):
    """Retrieves a single tag by its name."""
    return db.query(models.Tag).filter(models.Tag.name == tag_name).first()


def get_or_create_tags(db: Session, tags: list[str]) -> list[models.Tag]:
    """
    For a list of tag names, retrieves existing tags or creates new ones.
    Returns a list of Tag model instances.
    """
    tag_models = []
    for tag_name in tags:
        tag_name = tag_name.strip().lower()
        if not tag_name:
            continue
        db_tag = get_tag_by_name(db, tag_name)
        if not db_tag:
            db_tag = models.Tag(name=tag_name)
            db.add(db_tag)
            db.commit()
            db.refresh(db_tag)
        tag_models.append(db_tag)
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


def add_image_to_album(db: Session, image: models.Image, album: models.Album):
    """Adds an image to an album if it's not already there."""
    if image not in album.images:
        album.images.append(image)
        db.commit()
    return album
