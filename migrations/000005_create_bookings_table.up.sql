CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
--     service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    notes VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    booking_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(50),
    deleted_at TIMESTAMP NULL,
    deleted_by VARCHAR(50)
);
