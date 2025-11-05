-- Add target_attendees column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS target_attendees INTEGER DEFAULT 0;

-- Add comment to describe the column
COMMENT ON COLUMN events.target_attendees IS 'Target number of attendees planned for the event';

-- Create index for reporting queries (achievement analysis)
CREATE INDEX IF NOT EXISTS idx_events_target_attendees ON events (target_attendees);
