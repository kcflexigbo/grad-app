CREATE TABLE image_albums (
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, album_id)
);