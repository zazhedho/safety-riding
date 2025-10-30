CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(50)
);
