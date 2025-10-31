CREATE TABLE IF NOT EXISTS event_budgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL,
    category        VARCHAR(100) NOT NULL,
    description     TEXT,
    budget_amount   DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    actual_spent    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    budget_date     VARCHAR(20) NOT NULL,
    budget_month    INTEGER NOT NULL,
    budget_year     INTEGER NOT NULL,
    status          VARCHAR(50),
    notes           TEXT,

    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      TEXT,
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by      TEXT,
    deleted_at      TIMESTAMP,
    deleted_by      TEXT,

    CONSTRAINT fk_event_budgets_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

-- Indexes for filtering and performance
CREATE INDEX IF NOT EXISTS idx_event_budgets_event_id ON event_budgets (event_id);
CREATE INDEX IF NOT EXISTS idx_event_budgets_budget_date ON event_budgets (budget_date);
CREATE INDEX IF NOT EXISTS idx_event_budgets_budget_month ON event_budgets (budget_month);
CREATE INDEX IF NOT EXISTS idx_event_budgets_budget_year ON event_budgets (budget_year);
CREATE INDEX IF NOT EXISTS idx_event_budgets_category ON event_budgets (category);
CREATE INDEX IF NOT EXISTS idx_event_budgets_status ON event_budgets (status);
CREATE INDEX IF NOT EXISTS idx_event_budgets_deleted_at ON event_budgets (deleted_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_budgets_month_year
    ON event_budgets (budget_month, budget_year);

CREATE INDEX IF NOT EXISTS idx_event_budgets_event_date
    ON event_budgets (event_id, budget_date);

-- updated_at auto-touch trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_event_budgets_set_updated_at'
      AND c.relname = 'event_budgets'
  ) THEN
CREATE TRIGGER trg_event_budgets_set_updated_at
    BEFORE UPDATE ON event_budgets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
END IF;
END
$$;