-- Make school_id nullable and add public_id
ALTER TABLE events ALTER COLUMN school_id DROP NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS public_id UUID;

-- Add index for public_id
CREATE INDEX IF NOT EXISTS idx_events_public_id ON events (public_id);

-- Add composite index for public_id and event_date
CREATE INDEX IF NOT EXISTS idx_events_public_date ON events (public_id, event_date);

-- Add check constraint to ensure either school_id or public_id is set (but not both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_events_entity_type'
      AND conrelid = 'events'::regclass
  ) THEN
ALTER TABLE events
    ADD CONSTRAINT chk_events_entity_type
        CHECK (
            (school_id IS NOT NULL AND public_id IS NULL)
                OR
            (school_id IS NULL AND public_id IS NOT NULL)
            );
END IF;
END$$;

