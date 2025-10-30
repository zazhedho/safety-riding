CREATE TABLE IF NOT EXISTS work_order_services (
    id UUID PRIMARY KEY,
    work_order_id UUID NOT NULL,
    service_id UUID NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(50),
    CONSTRAINT fk_work_order FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );
