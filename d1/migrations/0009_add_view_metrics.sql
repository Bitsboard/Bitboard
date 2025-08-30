-- Migration: Add view metrics to listings table
-- Run with: wrangler d1 execute <DB_NAME> --file=d1/migrations/0009_add_view_metrics.sql

-- Add views column to listings table
ALTER TABLE listings ADD COLUMN views INTEGER DEFAULT 0 CHECK (views >= 0);

-- Create view_logs table to track individual views with safety measures
CREATE TABLE IF NOT EXISTS view_logs (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  viewer_ip TEXT NOT NULL,
  viewer_session TEXT NOT NULL,
  viewed_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_view_logs_listing_id ON view_logs(listing_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_viewer_ip ON view_logs(viewer_ip);
CREATE INDEX IF NOT EXISTS idx_view_logs_viewer_session ON view_logs(viewer_session);
CREATE INDEX IF NOT EXISTS idx_view_logs_viewed_at ON view_logs(viewed_at DESC);

-- Create unique constraint to prevent duplicate views from same IP/session within time window
CREATE UNIQUE INDEX IF NOT EXISTS idx_view_logs_unique_view ON view_logs(listing_id, viewer_ip, viewer_session);

-- Update existing listings to have 0 views
UPDATE listings SET views = 0 WHERE views IS NULL;
