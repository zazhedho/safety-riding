-- Add POLDA Accidents Permissions
-- This migration adds permissions for the new POLDA accidents menu

-- Insert POLDA accident permissions (only if not exists)
INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at) 
SELECT gen_random_uuid(), 'view_polda_accidents', 'View POLDA Accidents', 'polda_accidents', 'view', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'view_polda_accidents');

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at) 
SELECT gen_random_uuid(), 'create_polda_accidents', 'Create POLDA Accidents', 'polda_accidents', 'create', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'create_polda_accidents');

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at) 
SELECT gen_random_uuid(), 'update_polda_accidents', 'Update POLDA Accidents', 'polda_accidents', 'update', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'update_polda_accidents');

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at) 
SELECT gen_random_uuid(), 'delete_polda_accidents', 'Delete POLDA Accidents', 'polda_accidents', 'delete', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'delete_polda_accidents');

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at) 
SELECT gen_random_uuid(), 'list_polda_accidents', 'List POLDA Accidents', 'polda_accidents', 'list', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'list_polda_accidents');

-- Assign permissions to admin role (only if not already assigned)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
AND p.resource = 'polda_accidents'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- Assign permissions to superadmin role if exists (only if not already assigned)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'superadmin' 
AND p.resource = 'polda_accidents'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
