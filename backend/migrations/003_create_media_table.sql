CREATE TYPE media_type AS ENUM ('image', 'video');

CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    media_url VARCHAR(255) NOT NULL,

    media_type media_type NOT NULL DEFAULT 'image',

    caption TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);