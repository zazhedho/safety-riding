CREATE TABLE IF NOT EXISTS event_photos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL,
    photo_url       TEXT NOT NULL,
    caption         TEXT,
    photo_order     INTEGER NOT NULL DEFAULT 0,

    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      TEXT,
    deleted_at      TIMESTAMP,
    deleted_by      TEXT,

    CONSTRAINT fk_event_photos_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos (event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_order ON event_photos (event_id, photo_order);
CREATE INDEX IF NOT EXISTS idx_event_photos_deleted_at ON event_photos (deleted_at);
