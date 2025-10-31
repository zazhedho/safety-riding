CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    npsn            VARCHAR(20),
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

    student_count   INTEGER     NOT NULL DEFAULT 0,
    teacher_count   INTEGER     NOT NULL DEFAULT 0,
    major_count     INTEGER     NOT NULL DEFAULT 0,
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

-- Uniques (nullable; use partial index to allow multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS ux_schools_npsn
    ON schools (npsn) WHERE npsn IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_schools_email
    ON schools (LOWER(email)) WHERE email IS NOT NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_schools_city_id      ON schools (city_id);
CREATE INDEX IF NOT EXISTS idx_schools_district_id  ON schools (district_id);
CREATE INDEX IF NOT EXISTS idx_schools_province_id  ON schools (province_id);
CREATE INDEX IF NOT EXISTS idx_schools_name_ci      ON schools ((LOWER(name)));
CREATE INDEX IF NOT EXISTS idx_schools_deleted_at   ON schools (deleted_at);
CREATE INDEX IF NOT EXISTS idx_schools_last_visit   ON schools (last_visit_at);

-- updated_at auto-touch trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_schools_set_updated_at'
      AND c.relname = 'schools'
  ) THEN
CREATE TRIGGER trg_schools_set_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
END IF;
END
$$;