CREATE TABLE IF NOT EXISTS accidents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    police_report_no        VARCHAR(100) NOT NULL,
    accident_date           VARCHAR(20) NOT NULL,
    accident_time           VARCHAR(20) NOT NULL,
    location                TEXT NOT NULL,

    district_id             VARCHAR(20) NOT NULL,
    city_id                 VARCHAR(20) NOT NULL,
    province_id             VARCHAR(20) NOT NULL,

    latitude                DOUBLE PRECISION,
    longitude               DOUBLE PRECISION,

    road_type               VARCHAR(50),
    weather_condition       VARCHAR(50),
    road_condition          VARCHAR(50),
    vehicle_type            VARCHAR(50) NOT NULL,
    accident_type           VARCHAR(50) NOT NULL,

    death_count             INTEGER NOT NULL DEFAULT 0,
    injured_count           INTEGER NOT NULL DEFAULT 0,
    minor_injured_count     INTEGER NOT NULL DEFAULT 0,
    vehicle_count           INTEGER NOT NULL DEFAULT 0,

    cause_of_accident       TEXT,
    description             TEXT,
    police_station          VARCHAR(100),
    officer_name            VARCHAR(100),

    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by              TEXT,
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by              TEXT,
    deleted_at              TIMESTAMP,
    deleted_by              TEXT
);

-- Unique index for police report number
CREATE UNIQUE INDEX IF NOT EXISTS ux_accidents_police_report_no
    ON accidents (police_report_no) WHERE police_report_no IS NOT NULL;

-- Helpful indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_accidents_province_id        ON accidents (province_id);
CREATE INDEX IF NOT EXISTS idx_accidents_city_id            ON accidents (city_id);
CREATE INDEX IF NOT EXISTS idx_accidents_district_id        ON accidents (district_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_accidents_province_city_district
    ON accidents (province_id, city_id, district_id);

-- updated_at auto-touch trigger


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_accidents_set_updated_at'
      AND c.relname = 'accidents'
  ) THEN
CREATE TRIGGER trg_accidents_set_updated_at
    BEFORE UPDATE ON accidents
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
END IF;
END
$$;