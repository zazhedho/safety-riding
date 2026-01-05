-- Restructure Accident Menu Hierarchy
-- This migration implements the plan from ACCIDENT_MENU.md

-- Step 1: Ensure parent menu "Accidents" exists (reuse existing if possible)
UPDATE menu_items 
SET 
    display_name = 'Accidents',
    path = '',
    parent_id = NULL,
    order_index = 6
WHERE name = 'accidents';

-- Step 2: Create "Data Laka NTB by POLDA" menu as child (only if not exists)
INSERT INTO menu_items (id, name, display_name, path, icon, order_index, parent_id, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'polda_accidents',
    'Data Laka NTB by POLDA',
    '/polda-accidents',
    'bi-clipboard-data',
    1,
    (SELECT id FROM menu_items WHERE name = 'accidents' LIMIT 1),
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM menu_items WHERE name = 'polda_accidents'
);

-- Step 3: Create "Submit Case by AHASS/Dealer" menu as child (only if not exists)
INSERT INTO menu_items (id, name, display_name, path, icon, order_index, parent_id, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'submit_case_ahass',
    'Submit Case by AHASS/Dealer',
    '/accidents',
    'bi-tools',
    2,
    (SELECT id FROM menu_items WHERE name = 'accidents' LIMIT 1),
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM menu_items WHERE name = 'submit_case_ahass'
);

-- Step 4: Clean up any orphaned menus from previous migration attempts
DELETE FROM menu_items WHERE name IN ('accident_parent', 'accidents_parent');

-- Step 5: Ensure children have correct parent (fix any existing records)
UPDATE menu_items 
SET parent_id = (SELECT id FROM menu_items WHERE name = 'accidents' AND parent_id IS NULL LIMIT 1)
WHERE name IN ('polda_accidents', 'submit_case_ahass');
