-- ============================================================================
-- Add App Download Tracking Fields to Events Table
-- ============================================================================
-- This migration adds fields to track mobile app downloads during events
-- ============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS apps_downloaded INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS apps_name VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN events.apps_downloaded IS 'Number of app downloads during the event';
COMMENT ON COLUMN events.apps_name IS 'Name of the app downloaded (e.g., Motorkux, Other)';
