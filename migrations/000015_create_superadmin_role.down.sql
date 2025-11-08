-- Remove superadmin role menus
DELETE FROM role_menus WHERE role_id = (SELECT id FROM roles WHERE name = 'superadmin');

-- Remove superadmin role permissions
DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'superadmin');

-- Remove superadmin role
DELETE FROM roles WHERE name = 'superadmin';
