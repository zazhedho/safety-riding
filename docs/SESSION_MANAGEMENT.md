# Session Management Implementation Guide

## Overview

This document describes the session management system implemented for the Safety Riding Management System. The session management provides secure, Redis-based session storage for user authentication, supporting multiple device logins and session tracking.

## Architecture

### Components

1. **Redis Infrastructure** (`infrastructure/database/redis.go`)
   - Redis client initialization
   - Connection management
   - Configuration loading from environment variables

2. **Session Domain Model** (`internal/domain/session/session.go`)
   - Session data structure
   - Session information for listing

3. **Session Repository** (`internal/repositories/session/session_repo.go`)
   - CRUD operations for sessions in Redis
   - Token-based session retrieval
   - User-based session management

4. **Session Service** (`internal/services/session/session_service.go`)
   - Business logic for session management
   - Session validation
   - Device detection
   - Multi-device session handling

5. **Session Handler** (`internal/handlers/http/session/session.go`)
   - HTTP endpoints for session operations
   - Session listing
   - Session revocation

## Features

### ✅ Implemented Features

- **Session Creation** - Automatic session creation on login
- **Session Storage** - Redis-based session storage with automatic expiration
- **Session Validation** - JWT + Session validation on protected routes
- **Multiple Device Support** - Users can login from multiple devices
- **Session Tracking** - Track device info, IP, user agent, login time, last activity
- **Session Revocation** - Logout from specific devices
- **Bulk Revocation** - Logout from all other devices except current
- **Auto Expiration** - Sessions automatically expire based on JWT expiration

### 📊 Session Data Structure

```go
type Session struct {
    SessionID    string    // Unique session identifier
    UserID       string    // User ID
    Email        string    // User email
    Role         string    // User role
    Token        string    // JWT token
    DeviceInfo   string    // Device type (e.g., "Android Mobile", "Windows PC")
    IP           string    // Client IP address
    UserAgent    string    // Full user agent string
    LoginAt      time.Time // Login timestamp
    LastActivity time.Time // Last activity timestamp
    ExpiresAt    time.Time // Session expiration time
}
```

## API Endpoints

### 1. Get Active Sessions

**Endpoint:** `GET /api/user/sessions`

**Description:** Get all active sessions for the current user

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "status": 200,
  "message": "success",
  "request_id": "uuid",
  "data": {
    "sessions": [
      {
        "session_id": "uuid",
        "device_info": "Windows PC",
        "ip": "192.168.1.100",
        "login_at": "2025-01-15T10:30:00Z",
        "last_activity": "2025-01-15T14:25:00Z",
        "is_current_session": true
      },
      {
        "session_id": "uuid2",
        "device_info": "Android Mobile",
        "ip": "192.168.1.101",
        "login_at": "2025-01-14T08:15:00Z",
        "last_activity": "2025-01-15T12:00:00Z",
        "is_current_session": false
      }
    ],
    "total": 2
  }
}
```

### 2. Revoke Session

**Endpoint:** `DELETE /api/user/session/{session_id}`

**Description:** Revoke/logout a specific session by session ID

**Authentication:** Required (Bearer token)

**Parameters:**
- `session_id` (path) - The session ID to revoke

**Response:**
```json
{
  "status": 200,
  "message": "Session revoked successfully",
  "request_id": "uuid",
  "data": null
}
```

### 3. Revoke All Other Sessions

**Endpoint:** `POST /api/user/sessions/revoke-others`

**Description:** Logout from all devices except the current one

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "status": 200,
  "message": "All other sessions revoked successfully",
  "request_id": "uuid",
  "data": null
}
```

## Integration Guide

### Prerequisites

1. **Redis Server** must be running
   ```bash
   # Install Redis (Ubuntu/Debian)
   sudo apt-get install redis-server

   # Start Redis
   sudo systemctl start redis
   sudo systemctl enable redis

   # Verify Redis is running
   redis-cli ping
   # Should return: PONG
   ```

2. **Environment Variables** configured in `.env`:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

### Step 1: Initialize Redis in main.go

Add Redis initialization in your main application startup:

```go
import (
    "safety-riding/infrastructure/database"
    "safety-riding/pkg/logger"
)

func main() {
    // ... existing code ...

    // Initialize Redis
    redisClient, err := database.InitRedis()
    if err != nil {
        logger.WriteLog(logger.LogLevelWarning, "Redis not available, session management disabled")
        // Application can still run without Redis, but sessions won't work
    } else {
        defer database.CloseRedis()
        logger.WriteLog(logger.LogLevelInfo, "Session management enabled")
    }

    // ... continue with rest of initialization ...
}
```

### Step 2: Register Session Routes

Add session routes to your router configuration:

```go
import (
    sessionhandler "safety-riding/internal/handlers/http/session"
    sessionrepo "safety-riding/internal/repositories/session"
    sessionsvc "safety-riding/internal/services/session"
)

func (r *Routes) SessionRoutes() {
    // Initialize session components
    sessionRepo := sessionrepo.NewSessionRepository(database.GetRedisClient())
    sessionService := sessionsvc.NewSessionService(sessionRepo)
    sessionHandler := sessionhandler.NewSessionHandler(sessionService)

    // Protected routes (require authentication)
    authorized := r.Router.Group("/api/user")
    authorized.Use(r.Middleware.AuthMiddleware())
    {
        authorized.GET("/sessions", sessionHandler.GetActiveSessions)
        authorized.DELETE("/session/:session_id", sessionHandler.RevokeSession)
        authorized.POST("/sessions/revoke-others", sessionHandler.RevokeAllOtherSessions)
    }
}
```

### Step 3: Update Login Handler

Modify your login handler to create a session after successful authentication:

```go
import (
    "context"
    sessionrepo "safety-riding/internal/repositories/session"
    sessionsvc "safety-riding/internal/services/session"
)

func (h *HandlerUser) Login(ctx *gin.Context) {
    // ... existing login validation ...

    // After successful login and token generation:
    token, err := h.Service.LoginUser(req, logId.String())
    if err != nil {
        // ... error handling ...
    }

    // Create session if Redis is available
    if database.GetRedisClient() != nil {
        sessionRepo := sessionrepo.NewSessionRepository(database.GetRedisClient())
        sessionService := sessionsvc.NewSessionService(sessionRepo)

        user, _ := h.Service.UserRepo.GetByEmail(req.Email)
        session, err := sessionService.CreateSession(context.Background(), &user, token, ctx)
        if err != nil {
            logger.WriteLog(logger.LogLevelError, fmt.Sprintf("Failed to create session: %v", err))
            // Continue anyway - session is optional
        } else {
            logger.WriteLog(logger.LogLevelInfo, fmt.Sprintf("Session created: %s", session.SessionID))
        }
    }

    res := response.Response(http.StatusOK, "success", logId, map[string]interface{}{"token": token})
    ctx.JSON(http.StatusOK, res)
}
```

### Step 4: Update Logout Handler

Modify your logout handler to destroy the session:

```go
func (h *HandlerUser) Logout(ctx *gin.Context) {
    // ... existing code to get token ...

    // Destroy session if Redis is available
    if database.GetRedisClient() != nil {
        sessionRepo := sessionrepo.NewSessionRepository(database.GetRedisClient())
        sessionService := sessionsvc.NewSessionService(sessionRepo)

        err := sessionService.DestroySessionByToken(context.Background(), token.(string))
        if err != nil {
            logger.WriteLog(logger.LogLevelError, fmt.Sprintf("Failed to destroy session: %v", err))
            // Continue with token blacklist anyway
        }
    }

    // ... existing blacklist logic ...
}
```

### Step 5: Update Auth Middleware (Optional)

Optionally update the auth middleware to also validate sessions:

```go
func (m *Middleware) AuthMiddleware() gin.HandlerFunc {
    return func(ctx *gin.Context) {
        // ... existing JWT validation ...

        // Additional session validation if Redis is available
        if database.GetRedisClient() != nil {
            sessionRepo := sessionrepo.NewSessionRepository(database.GetRedisClient())
            sessionService := sessionsvc.NewSessionService(sessionRepo)

            _, err := sessionService.ValidateSession(context.Background(), tokenString)
            if err != nil {
                logger.WriteLog(logger.LogLevelError, fmt.Sprintf("Invalid session: %s", err.Error()))
                res := response.Response(http.StatusUnauthorized, "Session expired or invalid", logId, nil)
                ctx.AbortWithStatusJSON(http.StatusUnauthorized, res)
                return
            }
        }

        // ... continue with existing code ...
    }
}
```

## Redis Key Structure

The session system uses the following Redis key patterns:

1. **Session Data**: `session:{session_id}`
   - Stores the complete session object as JSON
   - TTL: Matches JWT expiration time

2. **User Sessions Set**: `user_sessions:{user_id}`
   - Stores a set of session IDs for each user
   - Enables listing all user sessions
   - TTL: Matches JWT expiration time

3. **Token to Session Mapping**: `token_session:{token}`
   - Maps JWT token to session ID
   - Enables quick session lookup by token
   - TTL: Matches JWT expiration time

## Device Detection

The system automatically detects the device type based on the User-Agent header:

- **Mobile Devices**: Android Mobile, iOS Mobile
- **Tablets**: Tablet
- **Desktop**: Windows PC, Mac, Linux
- **Unknown**: Unknown Device

## Security Considerations

1. **Session Expiration**: Sessions automatically expire based on JWT expiration time
2. **Token Blacklist**: Both session revocation and token blacklisting are used for logout
3. **IP Tracking**: Client IP is stored for security auditing
4. **Last Activity**: Updated on each authenticated request
5. **Secure Storage**: Sessions stored in Redis with automatic TTL

## Testing

### Manual Testing

1. **Test Login and Session Creation**:
   ```bash
   curl -X POST http://localhost:8080/api/user/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"Password123!"}'
   ```

2. **Get Active Sessions**:
   ```bash
   curl -X GET http://localhost:8080/api/user/sessions \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Revoke Specific Session**:
   ```bash
   curl -X DELETE http://localhost:8080/api/user/session/SESSION_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Revoke All Other Sessions**:
   ```bash
   curl -X POST http://localhost:8080/api/user/sessions/revoke-others \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Redis CLI Testing

```bash
# Connect to Redis
redis-cli

# List all session keys
KEYS session:*

# Get session data
GET session:YOUR_SESSION_ID

# Get user's sessions
SMEMBERS user_sessions:USER_ID

# Check session TTL
TTL session:YOUR_SESSION_ID
```

## Troubleshooting

### Redis Connection Failed

**Problem**: Application logs show "Failed to connect to Redis"

**Solution**:
1. Verify Redis is running: `sudo systemctl status redis`
2. Check Redis configuration in `.env`
3. Test Redis connection: `redis-cli ping`
4. Check firewall rules if Redis is on a different server

### Sessions Not Persisting

**Problem**: Sessions are created but immediately expire

**Solution**:
1. Check JWT_EXP environment variable
2. Verify Redis TTL is being set correctly
3. Check system clock synchronization

### Session Not Found After Login

**Problem**: Login succeeds but GET /sessions returns empty

**Solution**:
1. Check if session creation is properly integrated in login handler
2. Verify Redis is reachable
3. Check application logs for session creation errors

## Future Enhancements

- [ ] Session activity logging
- [ ] Suspicious activity detection (multiple IPs, unusual devices)
- [ ] Session limit per user (max N devices)
- [ ] Remember me / extended sessions
- [ ] Session migration for password changes
- [ ] Admin endpoints to view/revoke user sessions

## References

- [Redis Go Client Documentation](https://redis.uptrace.dev/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
