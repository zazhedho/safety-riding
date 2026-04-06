-- Add permissions resource permissions for the Permissions module.

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), 'view_permissions', 'View Permissions', 'permissions', 'view', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_permissions');

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), 'create_permissions', 'Create Permissions', 'permissions', 'create', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'create_permissions');

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), 'update_permissions', 'Update Permissions', 'permissions', 'update', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'update_permissions');

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), 'delete_permissions', 'Delete Permissions', 'permissions', 'delete', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'delete_permissions');

INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.resource = 'permissions'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'superadmin'
AND p.resource = 'permissions'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
