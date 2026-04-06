-- Add override permissions for finalized events and budgets.

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), 'override_finalized_events', 'Override Finalized Events', 'events', 'override_finalized', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'override_finalized_events');

INSERT INTO permissions (id, name, display_name, resource, action, created_at, updated_at)
SELECT gen_random_uuid(), 'override_finalized_budgets', 'Override Finalized Budgets', 'budgets', 'override_finalized', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'override_finalized_budgets');

INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
AND p.name IN ('override_finalized_events', 'override_finalized_budgets')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT
    gen_random_uuid(),
    r.id,
    p.id,
    NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'superadmin'
AND p.name IN ('override_finalized_events', 'override_finalized_budgets')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);
