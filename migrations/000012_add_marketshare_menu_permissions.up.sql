-- Insert Market Share menu item
INSERT INTO menu_items (id, name, display_name, path, icon, parent_id, order_index, is_active)
VALUES (
  gen_random_uuid(),
  'marketshare',
  'Market Share',
  '/marketshare',
  'bi-graph-up-arrow',
  NULL,
  8,
  TRUE
) ON CONFLICT (name) DO NOTHING;

-- Insert market share permissions
INSERT INTO permissions (id, name, display_name, resource, action)
VALUES
  (gen_random_uuid(), 'view_market_shares', 'View Market Shares', 'market_shares', 'view'),
  (gen_random_uuid(), 'create_market_shares', 'Create Market Shares', 'market_shares', 'create'),
  (gen_random_uuid(), 'update_market_shares', 'Update Market Shares', 'market_shares', 'update'),
  (gen_random_uuid(), 'delete_market_shares', 'Delete Market Shares', 'market_shares', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Assign menu to admin and staff roles
INSERT INTO role_menus (id, role_id, menu_item_id)
SELECT gen_random_uuid(), r.id, m.id
FROM roles r
JOIN menu_items m ON m.name = 'marketshare'
WHERE r.name IN ('admin', 'staff')
ON CONFLICT DO NOTHING;

-- Assign permissions to admin role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'market_shares'
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign view/create/update permissions to staff role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'market_shares'
WHERE r.name = 'staff'
  AND p.action IN ('view', 'create', 'update')
ON CONFLICT DO NOTHING;

-- Assign view permission to viewer role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r
JOIN permissions p ON p.resource = 'market_shares'
WHERE r.name = 'viewer'
  AND p.action = 'view'
ON CONFLICT DO NOTHING;
