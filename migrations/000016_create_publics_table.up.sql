CREATE TABLE IF NOT EXISTS publics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    category        VARCHAR(50) NOT NULL,
    address         TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(100),

    district_id     VARCHAR(20),
    district_name   VARCHAR(100),
    city_id         VARCHAR(20),
    city_name       VARCHAR(100),
    province_id     VARCHAR(20),
    province_name   VARCHAR(100),
    postal_code     VARCHAR(10),

    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,

    employee_count  INTEGER     NOT NULL DEFAULT 0,
    visit_count     INTEGER     NOT NULL DEFAULT 0,
    is_educated     BOOLEAN     NOT NULL DEFAULT FALSE,

    last_visit_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      TEXT,
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by      TEXT,
    deleted_at      TIMESTAMP,
    deleted_by      TEXT
);

-- Unique indexes (nullable; use partial index to allow multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS ux_publics_email
    ON publics (LOWER(email)) WHERE email IS NOT NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_publics_city_id      ON publics (city_id);
CREATE INDEX IF NOT EXISTS idx_publics_district_id  ON publics (district_id);
CREATE INDEX IF NOT EXISTS idx_publics_province_id  ON publics (province_id);
CREATE INDEX IF NOT EXISTS idx_publics_category     ON publics (category);
CREATE INDEX IF NOT EXISTS idx_publics_name_ci      ON publics ((LOWER(name)));
CREATE INDEX IF NOT EXISTS idx_publics_deleted_at   ON publics (deleted_at);
CREATE INDEX IF NOT EXISTS idx_publics_last_visit   ON publics (last_visit_at);

-- updated_at auto-touch trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_publics_set_updated_at'
      AND c.relname = 'publics'
  ) THEN
CREATE TRIGGER trg_publics_set_updated_at
    BEFORE UPDATE ON publics
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
END IF;
END
$$;