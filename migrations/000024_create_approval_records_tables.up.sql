CREATE TABLE IF NOT EXISTS approval_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_row_number INTEGER NOT NULL,
    submitted_at TIMESTAMP,
    response_id TEXT NOT NULL,
    request_number INTEGER,
    revision_number INTEGER,
    overall_status VARCHAR(50),
    requestor VARCHAR(255),
    edit_response_url TEXT,
    total_recipients INTEGER NOT NULL DEFAULT 0,
    participant_ids_json TEXT,
    recipients_json TEXT,
    raw_payload_json TEXT,
    synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT ux_approval_records_response UNIQUE (response_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_records_status
    ON approval_records (overall_status);
CREATE INDEX IF NOT EXISTS idx_approval_records_submitted_at
    ON approval_records (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_records_request_number
    ON approval_records (request_number);
CREATE INDEX IF NOT EXISTS idx_approval_records_deleted_at
    ON approval_records (deleted_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_approval_records_set_updated_at'
      AND c.relname = 'approval_records'
  ) THEN
    CREATE TRIGGER trg_approval_records_set_updated_at
      BEFORE UPDATE ON approval_records
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS app_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(150) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_configs_category
    ON app_configs (category);
CREATE INDEX IF NOT EXISTS idx_app_configs_is_active
    ON app_configs (is_active);
CREATE INDEX IF NOT EXISTS idx_app_configs_deleted_at
    ON app_configs (deleted_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_app_configs_set_updated_at'
      AND c.relname = 'app_configs'
  ) THEN
    CREATE TRIGGER trg_app_configs_set_updated_at
      BEFORE UPDATE ON app_configs
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

INSERT INTO app_configs (id, config_key, display_name, category, value, description, is_active)
VALUES (
    gen_random_uuid(),
    'approval_records.sheet_url',
    'Approval Records Google Sheets URL',
    'approval_records',
    'https://docs.google.com/spreadsheets/d/19Z0mBKZjahskKjR9L8tSL9t0O0XKitpKTziNW4z7EMc/edit?resourcekey=&gid=1705335255#gid=1705335255',
    'Google Sheets source URL used by the Approval Records sync process.',
    TRUE
)
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO menu_items (id, name, display_name, path, icon, parent_id, order_index, is_active)
VALUES
(
  gen_random_uuid(),
  'approval_records',
  'Approval Records',
  '/approval-records',
  'bi-clipboard-data',
  NULL,
  10,
  TRUE
),
(
  gen_random_uuid(),
  'configs',
  'Configurations',
  '/configs',
  'bi-sliders',
  NULL,
  903,
  TRUE
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (id, name, display_name, resource, action)
VALUES
  (gen_random_uuid(), 'view_approval_records', 'View Approval Records', 'approval_records', 'view'),
  (gen_random_uuid(), 'sync_approval_records', 'Sync Approval Records', 'approval_records', 'sync'),
  (gen_random_uuid(), 'view_configs', 'View Configurations', 'configs', 'view'),
  (gen_random_uuid(), 'update_configs', 'Update Configurations', 'configs', 'update')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_menus (id, role_id, menu_item_id)
SELECT gen_random_uuid(), r.id, m.id
FROM roles r
JOIN menu_items m ON m.name = 'approval_records'
WHERE r.name IN ('admin', 'staff', 'viewer', 'superadmin')
ON CONFLICT DO NOTHING;

INSERT INTO role_menus (id, role_id, menu_item_id)
SELECT gen_random_uuid(), r.id, m.id
FROM roles r
JOIN menu_items m ON m.name = 'configs'
WHERE r.name IN ('admin', 'superadmin')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'approval_records'
WHERE r.name IN ('admin', 'superadmin')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'approval_records'
WHERE r.name = 'staff'
  AND p.action IN ('view', 'sync')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'approval_records'
WHERE r.name = 'viewer'
  AND p.action IN ('view', 'sync')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'configs'
WHERE r.name IN ('admin', 'superadmin')
ON CONFLICT DO NOTHING;
