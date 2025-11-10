# Verbose Error Messages - Security Analysis

## 🔴 SECURITY ISSUE: Internal Error Exposure

### Problem Statement
Currently, the application exposes internal error messages directly to clients through:
```go
res.Error = err.Error()
```

This pattern appears in **16 handler files** and can leak sensitive information such as:
- Database schema details
- File system paths
- Internal service architecture
- SQL queries
- Environment configuration

### Examples of Problematic Code

#### ❌ BEFORE (Insecure - Exposes Internal Details)
```go
// Found in: accident.go, budget.go, event.go, school.go, etc.
data, err := h.Service.AddAccident(username, req)
if err != nil {
    logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AddAccident; Error: %+v", logPrefix, err))
    res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
    res.Error = err.Error()  // ❌ DANGEROUS: Exposes internal error
    ctx.JSON(http.StatusInternalServerError, res)
    return
}
```

**What could be exposed:**
```
"Error: pq: duplicate key value violates unique constraint \"accidents_pkey\""
"Error: dial tcp 127.0.0.1:5432: connect: connection refused"
"Error: SQLSTATE 23505: duplicate key value violates unique constraint"
"Error: cannot open file /var/lib/app/uploads/photo.jpg: permission denied"
```

### Security Risks

1. **Database Schema Leakage**
   - Table names
   - Column names
   - Constraint names
   - Foreign key relationships

2. **Infrastructure Details**
   - Database host/port
   - File system paths
   - Service URLs
   - Internal service names

3. **Attack Surface Expansion**
   - Helps attackers understand system architecture
   - Reveals technology stack details
   - Exposes validation rules
   - Shows internal business logic

### Recommended Solution

#### ✅ AFTER (Secure - Generic Messages)
```go
// Use helper function with error classification
data, err := h.Service.AddAccident(username, req)
if err != nil {
    logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AddAccident; Error: %+v", logPrefix, err))
    helpers.SendGenericErrorResponse(ctx, err, logId, logPrefix, "accident")
    return
}
```

#### New Helper Function Implementation
```go
// In helpers/handler_helpers.go

// ErrorType represents different categories of errors
type ErrorType int

const (
    ErrorTypeValidation ErrorType = iota
    ErrorTypeDuplicate
    ErrorTypeNotFound
    ErrorTypeUnauthorized
    ErrorTypeInternal
)

// ClassifyError determines error type without exposing details
func ClassifyError(err error) (ErrorType, string) {
    errMsg := err.Error()

    // Duplicate key violations
    if strings.Contains(errMsg, "duplicate") || strings.Contains(errMsg, "unique constraint") {
        return ErrorTypeDuplicate, "A record with this information already exists"
    }

    // Not found errors
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return ErrorTypeNotFound, "The requested resource was not found"
    }

    // Validation errors (should be handled separately)
    if strings.Contains(errMsg, "validation") {
        return ErrorTypeValidation, "Invalid input data"
    }

    // Authorization errors
    if strings.Contains(errMsg, "unauthorized") || strings.Contains(errMsg, "forbidden") {
        return ErrorTypeUnauthorized, "You do not have permission to perform this action"
    }

    // Default: Generic internal error (no details exposed)
    return ErrorTypeInternal, "An error occurred while processing your request"
}

// SendGenericErrorResponse sends error response without exposing internal details
func SendGenericErrorResponse(ctx *gin.Context, err error, logId interface{}, logPrefix string, resourceName string) {
    // Log full error details (for developers)
    logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Error: %+v", logPrefix, err))

    // Classify error and get user-friendly message
    errType, userMsg := ClassifyError(err)

    // Set appropriate HTTP status code
    statusCode := http.StatusInternalServerError
    switch errType {
    case ErrorTypeNotFound:
        statusCode = http.StatusNotFound
        userMsg = fmt.Sprintf("%s not found", resourceName)
    case ErrorTypeDuplicate:
        statusCode = http.StatusConflict
    case ErrorTypeValidation:
        statusCode = http.StatusBadRequest
    case ErrorTypeUnauthorized:
        statusCode = http.StatusUnauthorized
    }

    // Send generic message to client
    res := response.Response(statusCode, userMsg, logId, nil)
    res.Error = userMsg  // ✅ SAFE: Generic user-friendly message
    ctx.JSON(statusCode, res)
}
```

### Implementation Plan

#### Phase 1: Update Helper Functions
- [x] Create `ClassifyError()` function
- [x] Create `SendGenericErrorResponse()` function
- [ ] Update existing `SendErrorResponse()` to use classification

#### Phase 2: Update Handlers (16 files)
Replace all instances of:
```go
res.Error = err.Error()
```

With:
```go
helpers.SendGenericErrorResponse(ctx, err, logId, logPrefix, "resource_name")
```

**Files to update:**
- [x] helpers/handler_helpers.go (helper functions)
- [x] helpers/photo_helpers.go (helper functions)
- [ ] accident/accident.go
- [ ] budget/budget.go
- [ ] city/handler.go
- [ ] district/handler.go
- [ ] event/event.go
- [ ] marketshare/marketshare.go
- [ ] menu/menu.go
- [ ] permission/permission.go
- [ ] province/handler.go
- [ ] publics/publics.go
- [ ] role/role.go
- [ ] school/school.go
- [ ] session/session.go
- [ ] user/user.go

#### Phase 3: Add Tests
- [ ] Test error classification
- [ ] Test that internal details are NOT exposed
- [ ] Test that logs still contain full details

### Benefits of This Approach

✅ **Security**
- No internal error details exposed to clients
- Prevents information leakage
- Reduces attack surface

✅ **User Experience**
- Clear, actionable error messages
- Consistent error responses
- Localization-ready messages

✅ **Developer Experience**
- Full error details still in logs
- Easy debugging with logId
- Centralized error handling

✅ **Compliance**
- Follows OWASP security guidelines
- Meets security audit requirements
- Production-ready error handling

### Testing Checklist

```bash
# Test 1: Duplicate key error
curl -X POST /api/accident -d '{"id": "existing-id"}'
# Expected: "A record with this information already exists"
# NOT: "pq: duplicate key value violates unique constraint"

# Test 2: Database connection error
# (Simulate by stopping database)
curl -X GET /api/accidents
# Expected: "An error occurred while processing your request"
# NOT: "dial tcp 127.0.0.1:5432: connect: connection refused"

# Test 3: Not found error
curl -X GET /api/accident/nonexistent-id
# Expected: "accident not found"
# NOT: "record not found"

# Test 4: Verify logs still contain full details
# Check logs for complete error messages for debugging
```

### Monitoring & Alerts

Add monitoring for error patterns:
```go
// Track error types for monitoring
metrics.IncrementCounter("api.errors.type", map[string]string{
    "type": errType.String(),
    "handler": handlerName,
})
```

### References

- [OWASP: Improper Error Handling](https://owasp.org/www-community/Improper_Error_Handling)
- [CWE-209: Information Exposure Through an Error Message](https://cwe.mitre.org/data/definitions/209.html)
- [Go Secure Coding Practices](https://github.com/OWASP/Go-SCP)

---

**Status**: 🟡 In Progress
**Priority**: 🔴 High (Security Issue)
**Estimated Impact**: Fixes security vulnerability in 16 files
**Estimated Effort**: 2-3 hours
