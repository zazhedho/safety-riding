-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    parent_id UUID,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- Create role_menus junction table
CREATE TABLE IF NOT EXISTS role_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    menu_item_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    UNIQUE(role_id, menu_item_id)
);

-- Create indexes for better performance
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_menu_items_parent_id ON menu_items(parent_id);
CREATE INDEX idx_menu_items_order ON menu_items(order_index);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_role_menus_role_id ON role_menus(role_id);
CREATE INDEX idx_role_menus_menu_item_id ON role_menus(menu_item_id);

-- Add role column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Insert system roles (admin, staff, viewer)
INSERT INTO roles (id, name, display_name, description, is_system) VALUES
    (gen_random_uuid(), 'admin', 'Administrator', 'Full system access', TRUE),
    (gen_random_uuid(), 'staff', 'Staff', 'Staff access with limited permissions', TRUE),
    (gen_random_uuid(), 'viewer', 'Viewer', 'Read-only access', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert menu items
INSERT INTO menu_items (id, name, display_name, path, icon, order_index) VALUES
    (gen_random_uuid(), 'dashboard', 'Dashboard', '/dashboard', 'bi-speedometer2', 1),
    (gen_random_uuid(), 'profile', 'Profile', '/profile', 'bi-person-circle', 2),
    (gen_random_uuid(), 'schools', 'Schools', '/schools', 'bi-building', 3),
    (gen_random_uuid(), 'education_stats', 'Education Stats', '/schools/education-stats', 'bi-bar-chart', 4),
    (gen_random_uuid(), 'events', 'Events', '/events', 'bi-calendar-event', 5),
    (gen_random_uuid(), 'accidents', 'Accidents', '/accidents', 'bi-exclamation-triangle', 6),
    (gen_random_uuid(), 'budgets', 'Budgets', '/budgets', 'bi-cash-stack', 7),
    (gen_random_uuid(), 'users', 'Users', '/users', 'bi-people', 8),
    (gen_random_uuid(), 'roles', 'Roles', '/roles', 'bi-shield-lock', 9)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (id, name, display_name, resource, action) VALUES
    -- Dashboard permissions
    (gen_random_uuid(), 'view_dashboard', 'View Dashboard', 'dashboard', 'view'),

    -- School permissions
    (gen_random_uuid(), 'view_schools', 'View Schools', 'schools', 'view'),
    (gen_random_uuid(), 'create_schools', 'Create Schools', 'schools', 'create'),
    (gen_random_uuid(), 'update_schools', 'Update Schools', 'schools', 'update'),
    (gen_random_uuid(), 'delete_schools', 'Delete Schools', 'schools', 'delete'),
    (gen_random_uuid(), 'view_education_stats', 'View Education Statistics', 'education_stats', 'view'),

    -- Event permissions
    (gen_random_uuid(), 'view_events', 'View Events', 'events', 'view'),
    (gen_random_uuid(), 'create_events', 'Create Events', 'events', 'create'),
    (gen_random_uuid(), 'update_events', 'Update Events', 'events', 'update'),
    (gen_random_uuid(), 'delete_events', 'Delete Events', 'events', 'delete'),

    -- Accident permissions
    (gen_random_uuid(), 'view_accidents', 'View Accidents', 'accidents', 'view'),
    (gen_random_uuid(), 'create_accidents', 'Create Accidents', 'accidents', 'create'),
    (gen_random_uuid(), 'update_accidents', 'Update Accidents', 'accidents', 'update'),
    (gen_random_uuid(), 'delete_accidents', 'Delete Accidents', 'accidents', 'delete'),

    -- Budget permissions
    (gen_random_uuid(), 'view_budgets', 'View Budgets', 'budgets', 'view'),
    (gen_random_uuid(), 'create_budgets', 'Create Budgets', 'budgets', 'create'),
    (gen_random_uuid(), 'update_budgets', 'Update Budgets', 'budgets', 'update'),
    (gen_random_uuid(), 'delete_budgets', 'Delete Budgets', 'budgets', 'delete'),

    -- User permissions
    (gen_random_uuid(), 'view_users', 'View Users', 'users', 'view'),
    (gen_random_uuid(), 'create_users', 'Create Users', 'users', 'create'),
    (gen_random_uuid(), 'update_users', 'Update Users', 'users', 'update'),
    (gen_random_uuid(), 'delete_users', 'Delete Users', 'users', 'delete'),

    -- Role permissions
    (gen_random_uuid(), 'view_roles', 'View Roles', 'roles', 'view'),
    (gen_random_uuid(), 'create_roles', 'Create Roles', 'roles', 'create'),
    (gen_random_uuid(), 'update_roles', 'Update Roles', 'roles', 'update'),
    (gen_random_uuid(), 'delete_roles', 'Delete Roles', 'roles', 'delete'),
    (gen_random_uuid(), 'assign_permissions', 'Assign Permissions', 'roles', 'assign_permissions'),
    (gen_random_uuid(), 'assign_menus', 'Assign Menus', 'roles', 'assign_menus'),

    -- Profile permissions
    (gen_random_uuid(), 'view_profile', 'View Profile', 'profile', 'view'),
    (gen_random_uuid(), 'update_profile', 'Update Profile', 'profile', 'update')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign read and write permissions to staff role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'staff'
AND p.action IN ('view', 'create', 'update')
AND p.resource NOT IN ('users', 'roles')
ON CONFLICT DO NOTHING;

-- Assign view profile permission to staff
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'staff'
AND p.name IN ('view_profile', 'update_profile')
ON CONFLICT DO NOTHING;

-- Assign only view permissions to viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
AND p.action = 'view'
AND p.resource NOT IN ('users', 'roles')
ON CONFLICT DO NOTHING;

-- Assign view profile permission to viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
AND p.name IN ('view_profile')
ON CONFLICT DO NOTHING;

-- Assign all menus to admin role
INSERT INTO role_menus (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menu_items m
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign menus to staff role (all except users and roles)
INSERT INTO role_menus (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menu_items m
WHERE r.name = 'staff'
AND m.name NOT IN ('users', 'roles')
ON CONFLICT DO NOTHING;

-- Assign menus to viewer role (all except users and roles)
INSERT INTO role_menus (role_id, menu_item_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menu_items m
WHERE r.name = 'viewer'
AND m.name NOT IN ('users', 'roles')
ON CONFLICT DO NOTHING;
