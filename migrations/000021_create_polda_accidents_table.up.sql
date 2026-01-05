CREATE TABLE IF NOT EXISTS polda_accidents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    police_unit             VARCHAR(100) NOT NULL,
    total_accidents         INTEGER NOT NULL DEFAULT 0,
    total_deaths            INTEGER NOT NULL DEFAULT 0,
    total_severe_injury     INTEGER NOT NULL DEFAULT 0,
    total_minor_injury      INTEGER NOT NULL DEFAULT 0,
    period                  VARCHAR(50) NOT NULL,

    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by              TEXT,
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by              TEXT,
    deleted_at              TIMESTAMP,
    deleted_by              TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polda_accidents_police_unit ON polda_accidents (police_unit);
CREATE INDEX IF NOT EXISTS idx_polda_accidents_period ON polda_accidents (period);
CREATE INDEX IF NOT EXISTS idx_polda_accidents_deleted_at ON polda_accidents (deleted_at);

-- Unique constraint for police_unit + period combination
CREATE UNIQUE INDEX IF NOT EXISTS ux_polda_accidents_police_unit_period 
    ON polda_accidents (police_unit, period) WHERE deleted_at IS NULL;

-- Updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_polda_accidents_set_updated_at'
      AND c.relname = 'polda_accidents'
  ) THEN
CREATE TRIGGER trg_polda_accidents_set_updated_at
    BEFORE UPDATE ON polda_accidents
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
END IF;
END
$$;
