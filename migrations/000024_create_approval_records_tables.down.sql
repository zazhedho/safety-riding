DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id FROM permissions WHERE resource IN ('approval_records', 'configs')
);

DELETE FROM role_menus
WHERE menu_item_id IN (
  SELECT id FROM menu_items WHERE name IN ('approval_records', 'configs')
);

DELETE FROM permissions WHERE resource IN ('approval_records', 'configs');
DELETE FROM menu_items WHERE name IN ('approval_records', 'configs');
DROP TABLE IF EXISTS approval_records;
DROP TABLE IF EXISTS app_configs;
