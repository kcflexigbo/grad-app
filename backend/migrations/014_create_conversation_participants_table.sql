CREATE TABLE conversation_participants (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, conversation_id)
);