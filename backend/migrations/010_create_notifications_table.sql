CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow', 'download','chat_message');
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    related_entity_id INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);