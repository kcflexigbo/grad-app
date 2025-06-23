CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    reported_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reason TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reported_content CHECK (reported_media_id IS NOT NULL OR reported_comment_id IS NOT NULL)
);