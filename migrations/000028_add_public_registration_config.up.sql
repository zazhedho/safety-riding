INSERT INTO app_configs (id, config_key, display_name, category, value, description, is_active)
VALUES (
    gen_random_uuid(),
    'auth.public_registration_enabled',
    'Public Registration Enabled',
    'auth',
    'true',
    'Enable or disable public user self-registration. When disabled, the register UI should be hidden and the public register endpoint will reject requests.',
    TRUE
)
ON CONFLICT (config_key) DO NOTHING;
