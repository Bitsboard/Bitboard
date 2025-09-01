-- Migration 0021: Add User Blocking System
-- Creates user_blocks table for managing user blocking functionality

PRAGMA foreign_keys = OFF;

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blocker_id TEXT NOT NULL,  -- User who is doing the blocking
    blocked_id TEXT NOT NULL,  -- User who is being blocked
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    reason TEXT,  -- Optional reason for blocking
    
    -- Ensure users can't block themselves
    CHECK (blocker_id != blocked_id),
    
    -- Ensure unique blocking relationships (one user can only block another once)
    UNIQUE (blocker_id, blocked_id),
    
    -- Foreign key constraints
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_created_at ON user_blocks(created_at);

PRAGMA foreign_keys = ON;

-- Display success message
SELECT 'user_blocks table created successfully' as status;
