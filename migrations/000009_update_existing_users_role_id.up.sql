-- Update existing users to have role_id based on their current role string
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = users.role)
WHERE role_id IS NULL AND role IS NOT NULL;
