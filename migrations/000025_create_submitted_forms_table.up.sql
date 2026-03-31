CREATE TABLE IF NOT EXISTS submitted_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_row_number INTEGER NOT NULL,
    response_key TEXT NOT NULL,
    submitted_at TIMESTAMP,
    request_number INTEGER,
    full_name VARCHAR(255),
    email VARCHAR(255),
    whatsapp VARCHAR(100),
    full_address TEXT,
    activity_name VARCHAR(255),
    participant_count INTEGER NOT NULL DEFAULT 0,
    event_date DATE,
    event_time VARCHAR(50),
    material TEXT,
    training_duration VARCHAR(100),
    area_type VARCHAR(100),
    event_location_address TEXT,
    email_address VARCHAR(255),
    training_type VARCHAR(100),
    sheet_status VARCHAR(50),
    latest_status VARCHAR(50),
    raw_payload_json TEXT,
    synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT ux_submitted_forms_response_key UNIQUE (response_key)
);

CREATE INDEX IF NOT EXISTS idx_submitted_forms_request_number
    ON submitted_forms (request_number);
CREATE INDEX IF NOT EXISTS idx_submitted_forms_submitted_at
    ON submitted_forms (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submitted_forms_latest_status
    ON submitted_forms (latest_status);
CREATE INDEX IF NOT EXISTS idx_submitted_forms_deleted_at
    ON submitted_forms (deleted_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_submitted_forms_set_updated_at'
      AND c.relname = 'submitted_forms'
  ) THEN
    CREATE TRIGGER trg_submitted_forms_set_updated_at
      BEFORE UPDATE ON submitted_forms
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

INSERT INTO app_configs (id, config_key, display_name, category, value, description, is_active)
VALUES (
    gen_random_uuid(),
    'approval_records.submitted_forms_sheet_url',
    'Submitted Forms Google Sheets URL',
    'approval_records',
    'https://docs.google.com/spreadsheets/d/19Z0mBKZjahskKjR9L8tSL9t0O0XKitpKTziNW4z7EMc/edit?gid=60961733#gid=60961733',
    'Google Sheets source URL used by the Submitted Forms sync process.',
    TRUE
)
ON CONFLICT (config_key) DO NOTHING;
