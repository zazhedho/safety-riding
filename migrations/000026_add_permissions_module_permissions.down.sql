DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE resource = 'permissions'
);

DELETE FROM permissions
WHERE resource = 'permissions';
