CREATE TABLE IF NOT EXISTS events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id           UUID,
    public_id           UUID,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    event_date          VARCHAR(20) NOT NULL,
    start_time          VARCHAR(20) NOT NULL,
    end_time            VARCHAR(20) NOT NULL,
    location            TEXT NOT NULL,

    district_id         VARCHAR(20) NOT NULL,
    city_id             VARCHAR(20) NOT NULL,
    province_id         VARCHAR(20) NOT NULL,

    event_type          VARCHAR(50) NOT NULL,
    target_audience     VARCHAR(100),
    target_attendees    INTEGER DEFAULT 0,
    attendees_count     INTEGER NOT NULL DEFAULT 0,

    visiting_service_unit_entry INTEGER NOT NULL DEFAULT 0,
    visiting_service_profit     NUMERIC(15,2) NOT NULL DEFAULT 0,

    instructor_name     VARCHAR(100),
    instructor_phone    VARCHAR(20),
    status              VARCHAR(50),
    notes               TEXT,

    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by          TEXT,
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by          TEXT,
    deleted_at          TIMESTAMP,
    deleted_by          TEXT
);

-- Foreign key to schools table
CREATE INDEX IF NOT EXISTS idx_events_school_id ON events (school_id);

-- Helpful indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_events_province_id        ON events (province_id);
CREATE INDEX IF NOT EXISTS idx_events_city_id            ON events (city_id);
CREATE INDEX IF NOT EXISTS idx_events_district_id        ON events (district_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date         ON events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type         ON events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_status             ON events (status);
CREATE INDEX IF NOT EXISTS idx_events_title_ci           ON events ((LOWER(title)));
CREATE INDEX IF NOT EXISTS idx_events_deleted_at         ON events (deleted_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_events_school_date
    ON events (school_id, event_date);

-- updated_at auto-touch trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_events_set_updated_at'
      AND c.relname = 'events'
  ) THEN
CREATE TRIGGER trg_events_set_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
END IF;
END
$$;