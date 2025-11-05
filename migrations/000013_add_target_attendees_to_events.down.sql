-- Drop target_attendees column from events table
ALTER TABLE events
DROP COLUMN IF EXISTS target_attendees;

-- Drop index
DROP INDEX IF EXISTS idx_events_target_attendees;
