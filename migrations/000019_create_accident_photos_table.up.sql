-- ============================================================================
-- Create Accident Photos Table
-- ============================================================================
-- This migration creates the accident_photos table for storing photos
-- associated with accident reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS accident_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accident_id UUID NOT NULL,
    photo_url TEXT NOT NULL,
    caption TEXT,
    photo_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMP,
    deleted_by TEXT,

    FOREIGN KEY (accident_id) REFERENCES accidents(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accident_photos_accident_id ON accident_photos(accident_id);
CREATE INDEX IF NOT EXISTS idx_accident_photos_order ON accident_photos(accident_id, photo_order);
CREATE INDEX IF NOT EXISTS idx_accident_photos_deleted_at ON accident_photos(deleted_at);
