-- Remove constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_events_entity_type;

-- Drop indexes
DROP INDEX IF EXISTS idx_events_public_date;
DROP INDEX IF EXISTS idx_events_public_id;

-- Remove public_id column
ALTER TABLE events DROP COLUMN IF EXISTS public_id;

-- Make school_id NOT NULL again
-- Note: This assumes all events have school_id. If not, this will fail.
ALTER TABLE events ALTER COLUMN school_id SET NOT NULL;
