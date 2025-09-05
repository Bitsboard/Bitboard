-- Add system_notifications table for admin notifications
CREATE TABLE IF NOT EXISTS system_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT NOT NULL CHECK (icon IN ('info', 'success', 'warning', 'error', 'system')),
  target_group TEXT NOT NULL CHECK (target_group IN ('all', 'verified', 'unverified', 'admin', 'buyers', 'sellers')),
  action_url TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- Add user_notifications table to track which users have received which notifications
CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  read_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (notification_id) REFERENCES system_notifications(id) ON DELETE CASCADE,
  UNIQUE(user_id, notification_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_notifications_target_group ON system_notifications(target_group);
CREATE INDEX IF NOT EXISTS idx_system_notifications_status ON system_notifications(status);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created_at ON system_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read_at ON user_notifications(read_at);
