DROP TRIGGER IF EXISTS trg_event_budgets_set_updated_at ON event_budgets;

DROP INDEX IF EXISTS idx_event_budgets_event_date;
DROP INDEX IF EXISTS idx_event_budgets_month_year;
DROP INDEX IF EXISTS idx_event_budgets_deleted_at;
DROP INDEX IF EXISTS idx_event_budgets_status;
DROP INDEX IF EXISTS idx_event_budgets_category;
DROP INDEX IF EXISTS idx_event_budgets_budget_year;
DROP INDEX IF EXISTS idx_event_budgets_budget_month;
DROP INDEX IF EXISTS idx_event_budgets_budget_date;
DROP INDEX IF EXISTS idx_event_budgets_event_id;

DROP TABLE IF EXISTS event_budgets;
