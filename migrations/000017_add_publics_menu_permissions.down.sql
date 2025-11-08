-- Remove role permissions for publics
DELETE FROM role_permissions
WHERE permission_id IN (SELECT id FROM permissions WHERE resource = 'publics');

-- Remove role menus for publics
DELETE FROM role_menus
WHERE menu_item_id IN (SELECT id FROM menu_items WHERE name = 'publics');

-- Remove publics permissions
DELETE FROM permissions WHERE resource = 'publics';

-- Remove publics menu item
DELETE FROM menu_items WHERE name = 'publics';
