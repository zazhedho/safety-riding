-- Rollback POLDA Accidents Permissions

-- Remove role permissions for POLDA accidents
DELETE FROM role_permissions 
WHERE permission_id IN (
    SELECT id FROM permissions WHERE resource = 'polda_accidents'
);

-- Remove POLDA accident permissions
DELETE FROM permissions WHERE resource = 'polda_accidents';
