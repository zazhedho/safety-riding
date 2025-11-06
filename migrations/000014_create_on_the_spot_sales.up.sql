-- Create event_on_the_spot_sales table
CREATE TABLE IF NOT EXISTS event_on_the_spot_sales (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    vehicle_type   VARCHAR(100) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    quantity       INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by     TEXT,
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by     TEXT
);

COMMENT ON COLUMN event_on_the_spot_sales.payment_method IS 'Payment method used for the transaction (cash/credit)';
CREATE INDEX IF NOT EXISTS idx_event_on_the_spot_sales_event_id ON event_on_the_spot_sales (event_id);
