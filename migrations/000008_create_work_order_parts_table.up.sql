CREATE TABLE IF NOT EXISTS work_order_parts (
    id UUID PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    sparepart_id UUID REFERENCES spareparts(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(50)
);
