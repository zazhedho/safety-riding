CREATE TABLE IF NOT EXISTS spareparts (
    id UUID PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    stock INT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(50)
);
