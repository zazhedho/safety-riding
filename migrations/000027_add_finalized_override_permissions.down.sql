DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id
    FROM permissions
    WHERE name IN ('override_finalized_events', 'override_finalized_budgets')
);

DELETE FROM permissions
WHERE name IN ('override_finalized_events', 'override_finalized_budgets');
