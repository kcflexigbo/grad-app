CREATE TYPE conversation_type AS ENUM ('one_to_one', 'group');

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    type conversation_type NOT NULL DEFAULT 'one_to_one',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);