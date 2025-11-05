-- Remove role-menu assignments for Market Share
DELETE FROM role_menus
WHERE menu_item_id IN (SELECT id FROM menu_items WHERE name = 'marketshare');

-- Remove role-permission assignments for Market Share
DELETE FROM role_permissions
WHERE permission_id IN (SELECT id FROM permissions WHERE resource = 'market_shares');

-- Remove Market Share permissions
DELETE FROM permissions WHERE resource = 'market_shares';

-- Remove Market Share menu item
DELETE FROM menu_items WHERE name = 'marketshare';
