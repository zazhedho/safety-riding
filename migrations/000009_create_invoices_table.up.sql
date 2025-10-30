CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    total NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(50)
);
