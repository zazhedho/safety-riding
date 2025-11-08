-- ============================================================================
-- Rollback App Download Tracking Fields from Events Table
-- ============================================================================

ALTER TABLE events DROP COLUMN IF EXISTS apps_downloaded;
ALTER TABLE events DROP COLUMN IF EXISTS apps_name;
