DROP TRIGGER IF EXISTS trg_events_set_updated_at ON events;

DROP INDEX IF EXISTS idx_events_school_date;
DROP INDEX IF EXISTS idx_events_deleted_at;
DROP INDEX IF EXISTS idx_events_title_ci;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_events_event_type;
DROP INDEX IF EXISTS idx_events_event_date;
DROP INDEX IF EXISTS idx_events_district_id;
DROP INDEX IF EXISTS idx_events_city_id;
DROP INDEX IF EXISTS idx_events_province_id;
DROP INDEX IF EXISTS idx_events_school_id;

DROP TABLE IF EXISTS events;
