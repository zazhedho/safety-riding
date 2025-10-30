DROP TRIGGER IF EXISTS trg_schools_set_updated_at ON schools;
DROP FUNCTION IF EXISTS set_updated_at();

DROP INDEX IF EXISTS idx_schools_last_visit;
DROP INDEX IF EXISTS idx_schools_deleted_at;
DROP INDEX IF EXISTS idx_schools_name_ci;
DROP INDEX IF EXISTS idx_schools_province_id;
DROP INDEX IF EXISTS idx_schools_district_id;
DROP INDEX IF EXISTS idx_schools_city_id;
DROP INDEX IF EXISTS ux_schools_email;
DROP INDEX IF EXISTS ux_schools_npsn;

DROP TABLE IF EXISTS schools;