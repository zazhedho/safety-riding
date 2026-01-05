DROP TRIGGER IF EXISTS trg_polda_accidents_set_updated_at ON polda_accidents;
DROP INDEX IF EXISTS ux_polda_accidents_police_unit_period;
DROP INDEX IF EXISTS idx_polda_accidents_deleted_at;
DROP INDEX IF EXISTS idx_polda_accidents_period;
DROP INDEX IF EXISTS idx_polda_accidents_police_unit;
DROP TABLE IF EXISTS polda_accidents CASCADE;
