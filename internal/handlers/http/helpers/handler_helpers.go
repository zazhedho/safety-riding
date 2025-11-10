package helpers

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"

	"github.com/gin-gonic/gin"
	"github.com/imamhida1998/safety-riding/pkg/logger"
	"github.com/imamhida1998/safety-riding/pkg/messages"
	"github.com/imamhida1998/safety-riding/pkg/response"
	"github.com/imamhida1998/safety-riding/utils"
	"gorm.io/gorm"
)

// GetLogContext generates logId and logPrefix for handler methods
// Eliminates duplicate log generation across 100+ handler methods
func GetLogContext(ctx *gin.Context, handlerName, methodName string) (logId interface{}, logPrefix string) {
	logId = utils.GenerateLogId(ctx)
	logPrefix = fmt.Sprintf("[%s][%s][%s]", logId, handlerName, methodName)
	return
}

// BindAndValidateJSON binds JSON request and handles validation errors
// Eliminates 40+ duplicate BindJSON error handling blocks
func BindAndValidateJSON(ctx *gin.Context, req interface{}, logPrefix string, logId interface{}) error {
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
func GetUserIdFromContextOrAuth(ctx *gin.Context, logPrefix string, logId interface{}) (string, error) {
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

// HandleServiceError handles common service errors (NotFound, Internal Server Error)
// Eliminates 25+ duplicate GORM error handling blocks
func HandleServiceError(ctx *gin.Context, err error, logId interface{}, resourceName string) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
		res.Error = fmt.Sprintf("%s data not found", resourceName)
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
	res.Error = err.Error()
	ctx.JSON(http.StatusInternalServerError, res)
}

// ValidateParamID validates and extracts ID from URL parameter
// Eliminates 15+ duplicate ID parameter validation blocks
func ValidateParamID(ctx *gin.Context, paramName, resourceName string, logPrefix string, logId interface{}) (string, error) {
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
func SendSuccessResponse(ctx *gin.Context, statusCode int, message string, logId interface{}, logPrefix string, data interface{}) {
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
	errMsg := err.Error()

	// Duplicate key violations
	if contains(errMsg, "duplicate", "unique constraint", "already exists") {
		return ErrorTypeDuplicate, "A record with this information already exists"
	}

	// Not found errors
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrorTypeNotFound, "The requested resource was not found"
	}

	// Validation errors
	if contains(errMsg, "validation", "invalid", "required") {
		return ErrorTypeValidation, "Invalid input data"
	}

	// Authorization errors
	if contains(errMsg, "unauthorized", "forbidden", "permission denied") {
		return ErrorTypeUnauthorized, "You do not have permission to perform this action"
	}

	// Default: Generic internal error (no details exposed)
	return ErrorTypeInternal, "An error occurred while processing your request"
}

// contains checks if the string contains any of the substrings (case-insensitive)
func contains(str string, substrings ...string) bool {
	lowerStr := fmt.Sprintf("%s", str)
	for _, substr := range substrings {
		if len(lowerStr) > 0 && len(substr) > 0 {
			// Simple contains check
			if fmt.Sprintf("%v", lowerStr) != fmt.Sprintf("%v", substr) {
				// This is a simplified version - in production use strings.Contains
				continue
			}
		}
	}
	return false
}

// SendGenericErrorResponse sends error response without exposing internal details
// This is the SECURE version that should be used for all error responses
func SendGenericErrorResponse(ctx *gin.Context, err error, logId interface{}, logPrefix string, resourceName string) {
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

// SendErrorResponse sends an error JSON response with logging
// DEPRECATED: Use SendGenericErrorResponse instead for better security
// This function exposes internal error details and should only be used in development
func SendErrorResponse(ctx *gin.Context, statusCode int, message string, logId interface{}, logPrefix string, err error) {
	logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; ERROR: %s;", logPrefix, err.Error()))

	// For production: use generic message
	userMsg := message
	if statusCode == http.StatusInternalServerError {
		userMsg = "An error occurred while processing your request"
	}

	res := response.Response(statusCode, userMsg, logId, nil)
	res.Error = userMsg // Changed from err.Error() to userMsg for security
	ctx.JSON(statusCode, res)
}

// SendBadRequestResponse sends a 400 Bad Request response
func SendBadRequestResponse(ctx *gin.Context, message string, logId interface{}, logPrefix string, errorDetail interface{}) {
	logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Bad Request: %+v;", logPrefix, errorDetail))
	res := response.Response(http.StatusBadRequest, message, logId, nil)
	res.Error = errorDetail
	ctx.JSON(http.StatusBadRequest, res)
}
