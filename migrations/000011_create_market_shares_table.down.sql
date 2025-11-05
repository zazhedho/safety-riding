-- Drop trigger
DROP TRIGGER IF EXISTS trg_market_shares_set_updated_at ON market_shares;

-- Drop indexes
DROP INDEX IF EXISTS idx_market_shares_unique_location_period;
DROP INDEX IF EXISTS idx_market_shares_location_period;
DROP INDEX IF EXISTS idx_market_shares_location;
DROP INDEX IF EXISTS idx_market_shares_month_year;
DROP INDEX IF EXISTS idx_market_shares_deleted_at;
DROP INDEX IF EXISTS idx_market_shares_year;
DROP INDEX IF EXISTS idx_market_shares_month;
DROP INDEX IF EXISTS idx_market_shares_district_id;
DROP INDEX IF EXISTS idx_market_shares_city_id;
DROP INDEX IF EXISTS idx_market_shares_province_id;

-- Drop table
DROP TABLE IF EXISTS market_shares;
