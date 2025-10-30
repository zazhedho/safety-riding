CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    method VARCHAR(30) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    paid_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(50)
);
