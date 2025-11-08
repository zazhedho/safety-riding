-- Create superadmin role with all permissions
INSERT INTO roles (id, name, display_name, description, is_system, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'superadmin',
    'Super Administrator',
    'Super Administrator - Highest privilege level with full system access',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (name) DO NOTHING;

-- Grant all existing permissions to superadmin
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT
    (SELECT id FROM roles WHERE name = 'superadmin'),
    p.id,
    NOW()
FROM permissions p
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'superadmin')
    AND rp.permission_id = p.id
);

-- Grant all existing menus to superadmin
INSERT INTO role_menus (role_id, menu_item_id, created_at)
SELECT
    (SELECT id FROM roles WHERE name = 'superadmin'),
    m.id,
    NOW()
FROM menu_items m
WHERE NOT EXISTS (
    SELECT 1 FROM role_menus rm
    WHERE rm.role_id = (SELECT id FROM roles WHERE name = 'superadmin')
    AND rm.menu_item_id = m.id
);
