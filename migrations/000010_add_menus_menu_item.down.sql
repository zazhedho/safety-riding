-- Remove menu from role_menus
DELETE FROM role_menus
WHERE menu_item_id IN (SELECT id FROM menu_items WHERE name = 'menus');

-- Remove menu item
DELETE FROM menu_items WHERE name = 'menus';
