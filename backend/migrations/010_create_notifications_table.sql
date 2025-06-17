-- First, create an ENUM type for notification types for better data integrity
CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow', 'download');

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    related_entity_id INTEGER, -- Can be an image_id, comment_id, etc.
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);