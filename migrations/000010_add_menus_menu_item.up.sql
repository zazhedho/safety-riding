-- Insert Menus menu item
INSERT INTO menu_items (id, name, display_name, path, icon, parent_id, order_index, is_active)
VALUES (
  gen_random_uuid(),
  'menus',
  'Menus',
  '/menus',
  'bi-list-ul',
  NULL,
  10,
  true
) ON CONFLICT (name) DO NOTHING;

-- Assign to admin role
INSERT INTO role_menus (id, role_id, menu_item_id)
SELECT gen_random_uuid(), r.id, m.id
FROM roles r, menu_items m
WHERE r.name = 'admin' AND m.name = 'menus'
ON CONFLICT DO NOTHING;
