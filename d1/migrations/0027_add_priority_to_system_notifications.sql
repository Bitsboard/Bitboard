-- Add priority field to system_notifications table
ALTER TABLE system_notifications ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Update existing notifications to have normal priority
UPDATE system_notifications SET priority = 'normal' WHERE priority IS NULL;
