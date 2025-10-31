DROP TRIGGER IF EXISTS trg_accidents_set_updated_at ON accidents;

DROP INDEX IF EXISTS idx_accidents_province_city_district;
DROP INDEX IF EXISTS idx_accidents_deleted_at;
DROP INDEX IF EXISTS idx_accidents_location_ci;
DROP INDEX IF EXISTS idx_accidents_police_station;
DROP INDEX IF EXISTS idx_accidents_vehicle_type;
DROP INDEX IF EXISTS idx_accidents_accident_type;
DROP INDEX IF EXISTS idx_accidents_accident_date;
DROP INDEX IF EXISTS idx_accidents_district_id;
DROP INDEX IF EXISTS idx_accidents_city_id;
DROP INDEX IF EXISTS idx_accidents_province_id;
DROP INDEX IF EXISTS ux_accidents_police_report_no;

DROP TABLE IF EXISTS accidents;
