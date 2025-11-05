package session

import (
	"context"
	domainsession "safety-riding/internal/domain/session"
	"time"
)

// RepoSessionInterface defines the interface for session repository
type RepoSessionInterface interface {
	// Create creates a new session
	Create(ctx context.Context, session *domainsession.Session) error

	// GetBySessionID retrieves a session by session ID
	GetBySessionID(ctx context.Context, sessionID string) (*domainsession.Session, error)

	// GetByUserID retrieves all active sessions for a user
	GetByUserID(ctx context.Context, userID string) ([]*domainsession.Session, error)

	// GetByToken retrieves a session by token
	GetByToken(ctx context.Context, token string) (*domainsession.Session, error)

	// UpdateActivity updates the last activity time of a session
	UpdateActivity(ctx context.Context, sessionID string) error

	// Delete deletes a session by session ID
	Delete(ctx context.Context, sessionID string) error

	// DeleteByUserID deletes all sessions for a user
	DeleteByUserID(ctx context.Context, userID string) error

	// DeleteExpired deletes all expired sessions
	DeleteExpired(ctx context.Context) error

	// SetExpiration sets custom expiration for a session
	SetExpiration(ctx context.Context, sessionID string, expiration time.Duration) error
}
