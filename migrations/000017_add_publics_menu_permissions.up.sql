-- Insert Publics menu item
INSERT INTO menu_items (id, name, display_name, path, icon, parent_id, order_index, is_active)
VALUES (
  gen_random_uuid(),
  'publics',
  'Public Entities',
  '/publics',
  'bi-building',
  NULL,
  4,
  TRUE
) ON CONFLICT (name) DO NOTHING;

-- Insert publics permissions
INSERT INTO permissions (id, name, display_name, resource, action)
VALUES
  (gen_random_uuid(), 'view_publics', 'View Public Entities', 'publics', 'view'),
  (gen_random_uuid(), 'create_publics', 'Create Public Entities', 'publics', 'create'),
  (gen_random_uuid(), 'update_publics', 'Update Public Entities', 'publics', 'update'),
  (gen_random_uuid(), 'delete_publics', 'Delete Public Entities', 'publics', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Assign menu to admin, staff, and superadmin roles
INSERT INTO role_menus (id, role_id, menu_item_id)
SELECT gen_random_uuid(), r.id, m.id
FROM roles r
JOIN menu_items m ON m.name = 'publics'
WHERE r.name IN ('admin', 'staff', 'superadmin')
ON CONFLICT DO NOTHING;

-- Assign permissions to admin and superadmin roles
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'publics'
WHERE r.name IN ('admin', 'superadmin')
ON CONFLICT DO NOTHING;

-- Assign view/create/update permissions to staff role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'publics'
WHERE r.name = 'staff'
  AND p.action IN ('view', 'create', 'update')
ON CONFLICT DO NOTHING;

-- Assign view permission to viewer role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'publics'
WHERE r.name = 'viewer'
  AND p.action = 'view'
ON CONFLICT DO NOTHING;
