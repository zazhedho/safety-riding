-- Drop foreign key constraint from users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_role;

-- Drop role_id column from users table
ALTER TABLE users DROP COLUMN IF EXISTS role_id;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_role_id;
DROP INDEX IF EXISTS idx_role_menus_menu_item_id;
DROP INDEX IF EXISTS idx_role_menus_role_id;
DROP INDEX IF EXISTS idx_role_permissions_permission_id;
DROP INDEX IF EXISTS idx_role_permissions_role_id;
DROP INDEX IF EXISTS idx_menu_items_order;
DROP INDEX IF EXISTS idx_menu_items_parent_id;
DROP INDEX IF EXISTS idx_permissions_resource_action;
DROP INDEX IF EXISTS idx_roles_name;

-- Drop junction tables
DROP TABLE IF EXISTS role_menus;
DROP TABLE IF EXISTS role_permissions;

-- Drop main tables
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
