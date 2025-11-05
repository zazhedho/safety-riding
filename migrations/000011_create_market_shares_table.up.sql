CREATE TABLE IF NOT EXISTS market_shares (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Location information
    province_id                     VARCHAR(10) NOT NULL,
    province_name                   VARCHAR(255) NOT NULL,
    city_id                         VARCHAR(10) NOT NULL,
    city_name                       VARCHAR(255) NOT NULL,
    district_id                     VARCHAR(10) NOT NULL,
    district_name                   VARCHAR(255) NOT NULL,

    -- Period information
    month                           INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year                            INTEGER NOT NULL CHECK (year >= 2000),

    -- Company sales data
    monthly_sales                   DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    yearly_sales                    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    monthly_sales_percentage        DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (monthly_sales_percentage >= 0 AND monthly_sales_percentage <= 100),
    yearly_sales_percentage         DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (yearly_sales_percentage >= 0 AND yearly_sales_percentage <= 100),

    -- Competitor sales data
    monthly_competitor_sales        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    yearly_competitor_sales         DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    monthly_competitor_percentage   DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (monthly_competitor_percentage >= 0 AND monthly_competitor_percentage <= 100),
    yearly_competitor_percentage    DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (yearly_competitor_percentage >= 0 AND yearly_competitor_percentage <= 100),

    -- Additional info
    notes                           TEXT,

    -- Audit fields
    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by                      TEXT,
    updated_at                      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by                      TEXT,
    deleted_at                      TIMESTAMP,
    deleted_by                      TEXT
);

-- Indexes for filtering and performance
CREATE INDEX IF NOT EXISTS idx_market_shares_province_id ON market_shares (province_id);
CREATE INDEX IF NOT EXISTS idx_market_shares_city_id ON market_shares (city_id);
CREATE INDEX IF NOT EXISTS idx_market_shares_district_id ON market_shares (district_id);
CREATE INDEX IF NOT EXISTS idx_market_shares_month ON market_shares (month);
CREATE INDEX IF NOT EXISTS idx_market_shares_year ON market_shares (year);
CREATE INDEX IF NOT EXISTS idx_market_shares_deleted_at ON market_shares (deleted_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_market_shares_month_year
    ON market_shares (month, year);

CREATE INDEX IF NOT EXISTS idx_market_shares_location
    ON market_shares (province_id, city_id, district_id);

CREATE INDEX IF NOT EXISTS idx_market_shares_location_period
    ON market_shares (province_id, city_id, district_id, year, month);

-- Unique constraint to prevent duplicate entries for same location and period
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_shares_unique_location_period
    ON market_shares (province_id, city_id, district_id, year, month)
    WHERE deleted_at IS NULL;

-- updated_at auto-touch trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'trg_market_shares_set_updated_at'
      AND c.relname = 'market_shares'
  ) THEN
    CREATE TRIGGER trg_market_shares_set_updated_at
        BEFORE UPDATE ON market_shares
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;
