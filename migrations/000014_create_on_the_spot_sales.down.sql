DROP TABLE IF EXISTS event_on_the_spot_sales;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS on_the_spot_sales_quantity INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS on_the_spot_sales_vehicle_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS on_the_spot_sales_payment_method VARCHAR(20);
