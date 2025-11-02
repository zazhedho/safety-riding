-- Revert role_id for all users
UPDATE users
SET role_id = NULL;
