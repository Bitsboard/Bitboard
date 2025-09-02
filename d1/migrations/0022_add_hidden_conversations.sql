-- Migration 0022: Add Hidden Conversations System
CREATE TABLE IF NOT EXISTS hidden_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    hidden_at INTEGER NOT NULL,
    UNIQUE (user_id, chat_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hidden_conversations_user_id ON hidden_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_conversations_chat_id ON hidden_conversations (chat_id);
