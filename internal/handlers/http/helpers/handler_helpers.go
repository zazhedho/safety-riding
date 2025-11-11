package helpers

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"
)

// GetLogContext generates logId and logPrefix for handler methods
// Eliminates duplicate log generation across 100+ handler methods
func GetLogContext(ctx *gin.Context, handlerName, methodName string) (logId uuid.UUID, logPrefix string) {
	logId = utils.GenerateLogId(ctx)
	logPrefix = fmt.Sprintf("[%s][%s][%s]", logId, handlerName, methodName)
	return
}

// BindAndValidateJSON binds JSON request and handles validation errors
// Eliminates 40+ duplicate BindJSON error handling blocks
func BindAndValidateJSON(ctx *gin.Context, req interface{}, logPrefix string, logId uuid.UUID) error {
	if err := ctx.BindJSON(req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return err
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))
	return nil
}

// GetUsername extracts username from authentication context
// Eliminates 35+ duplicate username extraction blocks
func GetUsername(ctx *gin.Context) string {
	authData := utils.GetAuthData(ctx)
	return utils.InterfaceString(authData["username"])
}

// GetUserRole extracts user role from authentication context
func GetUserRole(ctx *gin.Context) string {
	authData := utils.GetAuthData(ctx)
	return utils.InterfaceString(authData["role"])
}

// GetUserId extracts user ID from authentication context
func GetUserId(ctx *gin.Context) string {
	authData := utils.GetAuthData(ctx)
	return utils.InterfaceString(authData["user_id"])
}

// GetUserIdFromContextOrAuth attempts to get user ID from context first, then falls back to auth data
// Eliminates duplicate user ID extraction with fallback logic
func GetUserIdFromContextOrAuth(ctx *gin.Context, logPrefix string, logId uuid.UUID) (string, error) {
	userId, exists := ctx.Get("userId")
	if !exists {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; User ID not found in context", logPrefix))

		authData := utils.GetAuthData(ctx)
		if authData != nil {
			if userIdFromAuth := utils.InterfaceString(authData["user_id"]); userIdFromAuth != "" {
				return userIdFromAuth, nil
			}
		}

		res := response.Response(http.StatusUnauthorized, "Unauthorized", logId, nil)
		ctx.JSON(http.StatusUnauthorized, res)
		return "", errors.New("unauthorized")
	}
	return userId.(string), nil
}

// HandleServiceError handles common service errors using generic error responses
// Eliminates 25+ duplicate GORM error handling blocks
// SECURE: Uses SendGenericErrorResponse to prevent internal error exposure
func HandleServiceError(ctx *gin.Context, err error, logId uuid.UUID, logPrefix string, resourceName string) {
	// Use generic error response for security (no internal details exposed)
	SendGenericErrorResponse(ctx, err, logId, logPrefix, resourceName)
}

// ValidateParamID validates and extracts ID from URL parameter
// Eliminates 15+ duplicate ID parameter validation blocks
func ValidateParamID(ctx *gin.Context, paramName, resourceName string, logPrefix string, logId uuid.UUID) (string, error) {
	id := ctx.Param(paramName)
	if id == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing %s ID", logPrefix, resourceName))
		res := response.Response(http.StatusBadRequest, fmt.Sprintf("%s ID is required", resourceName), logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return "", fmt.Errorf("missing %s ID", resourceName)
	}
	return id, nil
}

// SendSuccessResponse sends a successful JSON response with logging
// Eliminates 100+ duplicate success response blocks
func SendSuccessResponse(ctx *gin.Context, statusCode int, message string, logId uuid.UUID, logPrefix string, data interface{}) {
	res := response.Response(statusCode, message, logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(statusCode, res)
}

// ErrorType represents different categories of errors
type ErrorType int

const (
	ErrorTypeValidation ErrorType = iota
	ErrorTypeDuplicate
	ErrorTypeNotFound
	ErrorTypeUnauthorized
	ErrorTypeInternal
)

// ClassifyError determines error type without exposing internal details
func ClassifyError(err error) (ErrorType, string) {
	errMsg := strings.ToLower(err.Error())

	// Duplicate key violations
	if containsAny(errMsg, "duplicate", "unique constraint", "already exists") {
		return ErrorTypeDuplicate, "A record with this information already exists"
	}

	// Not found errors
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrorTypeNotFound, "The requested resource was not found"
	}

	// Validation errors
	if containsAny(errMsg, "validation", "invalid", "required") {
		return ErrorTypeValidation, "Invalid input data"
	}

	// Authorization errors
	if containsAny(errMsg, "unauthorized", "forbidden", "permission denied") {
		return ErrorTypeUnauthorized, "You do not have permission to perform this action"
	}

	// Default: Generic internal error (no details exposed)
	return ErrorTypeInternal, "An error occurred while processing your request"
}

// containsAny checks if the string contains any of the substrings (case-insensitive)
func containsAny(str string, substrings ...string) bool {
	lowerStr := strings.ToLower(str)
	for _, substr := range substrings {
		if strings.Contains(lowerStr, strings.ToLower(substr)) {
			return true
		}
	}
	return false
}

// SendGenericErrorResponse sends error response without exposing internal details
// This is the SECURE version that should be used for all error responses
func SendGenericErrorResponse(ctx *gin.Context, err error, logId uuid.UUID, logPrefix string, resourceName string) {
	// Log full error details (for developers only - not sent to client)
	logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Error: %+v", logPrefix, err))

	// Classify error and get user-friendly message
	errType, userMsg := ClassifyError(err)

	// Set appropriate HTTP status code
	statusCode := http.StatusInternalServerError
	switch errType {
	case ErrorTypeNotFound:
		statusCode = http.StatusNotFound
		if resourceName != "" {
			userMsg = fmt.Sprintf("%s not found", resourceName)
		}
	case ErrorTypeDuplicate:
		statusCode = http.StatusConflict
	case ErrorTypeValidation:
		statusCode = http.StatusBadRequest
	case ErrorTypeUnauthorized:
		statusCode = http.StatusUnauthorized
	}

	// Send generic message to client (SECURE - no internal details)
	res := response.Response(statusCode, userMsg, logId, nil)
	res.Error = userMsg // ✅ SAFE: Generic user-friendly message
	ctx.JSON(statusCode, res)
}

// SendErrorResponse is DEPRECATED and REMOVED for security reasons
// Use SendGenericErrorResponse instead - it's secure for all environments
// This ensures no internal error details are ever exposed to clients
//
// Migration:
//   OLD: helpers.SendErrorResponse(ctx, http.StatusInternalServerError, "Failed", logId, logPrefix, err)
//   NEW: helpers.SendGenericErrorResponse(ctx, err, logId, logPrefix, "resource_name")
//
// REMOVED: This function is intentionally removed to prevent accidental use
// If you see compilation errors, migrate to SendGenericErrorResponse

// SendBadRequestResponse sends a 400 Bad Request response
func SendBadRequestResponse(ctx *gin.Context, message string, logId uuid.UUID, logPrefix string, errorDetail interface{}) {
	logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Bad Request: %+v;", logPrefix, errorDetail))
	res := response.Response(http.StatusBadRequest, message, logId, nil)
	res.Error = errorDetail
	ctx.JSON(http.StatusBadRequest, res)
}
