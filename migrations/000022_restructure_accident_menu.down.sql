-- Rollback Accident Menu Hierarchy Restructure

-- Step 1: Remove child menus
DELETE FROM menu_items WHERE name IN ('polda_accidents', 'submit_case_ahass');

-- Step 2: Restore original accidents menu
UPDATE menu_items 
SET 
    display_name = 'Accidents',
    path = '/accidents',
    parent_id = NULL,
    order_index = 6
WHERE name = 'accidents';
