CREATE TABLE media_albums (
    media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    PRIMARY KEY (media_id, album_id)
);