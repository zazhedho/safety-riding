CREATE TABLE IF NOT EXISTS blacklist (
    id VARCHAR(36) PRIMARY KEY,
    token TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT idx_unique_token UNIQUE (token)
);
