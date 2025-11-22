package handlersession

import (
	"context"
	"fmt"
	"net/http"
	interfacesession "safety-riding/internal/interfaces/session"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
)

type HandlerSession struct {
	Service interfacesession.ServiceSessionInterface
}

func NewSessionHandler(s interfacesession.ServiceSessionInterface) *HandlerSession {
	return &HandlerSession{Service: s}
}

// GetActiveSessions godoc
// @Summary Get all active sessions for the current user
// @Description Get all active sessions for the current user
// @Tags Sessions
// @Accept  json
// @Produce  json
// @Success 200 {object} response.Success
// @Failure 401 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user/sessions [get]
func (h *HandlerSession) GetActiveSessions(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SessionHandler][GetActiveSessions]", logId)

	userID, ok := ctx.Get("userId")
	if !ok {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; userId not found in context", logPrefix))
		res := response.Response(http.StatusUnauthorized, messages.MsgFail, logId, nil)
		res.Error = "user not authenticated"
		ctx.JSON(http.StatusUnauthorized, res)
		return
	}

	// Get current session ID from token
	token, _ := ctx.Get("token")
	currentSession, err := h.Service.GetSessionByToken(context.Background(), token.(string))
	currentSessionID := ""
	if err == nil && currentSession != nil {
		currentSessionID = currentSession.SessionID
	}

	sessions, err := h.Service.GetUserSessions(context.Background(), userID.(string), currentSessionID)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetUserSessions; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "success", logId, map[string]interface{}{
		"sessions": sessions,
		"total":    len(sessions),
	})
	ctx.JSON(http.StatusOK, res)
}

// RevokeSession godoc
// @Summary Revoke a specific session
// @Description Revoke/logout a specific session by session ID
// @Tags Sessions
// @Accept  json
// @Produce  json
// @Param session_id path string true "Session ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 401 {object} response.Error
// @Failure 403 {object} response.Error
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user/session/{session_id} [delete]
func (h *HandlerSession) RevokeSession(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SessionHandler][RevokeSession]", logId)

	sessionID := ctx.Param("session_id")
	if sessionID == "" {
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = "session_id is required"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	userID, ok := ctx.Get("userId")
	if !ok {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; userId not found in context", logPrefix))
		res := response.Response(http.StatusUnauthorized, messages.MsgFail, logId, nil)
		res.Error = "user not authenticated"
		ctx.JSON(http.StatusUnauthorized, res)
		return
	}

	// Verify the session belongs to the user
	session, err := h.Service.GetSessionBySessionID(context.Background(), sessionID)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetSessionBySessionID; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusNotFound, messages.MsgFail, logId, nil)
		res.Error = "session not found"
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	if session.UserID != userID.(string) {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; unauthorized session revocation attempt", logPrefix))
		res := response.Response(http.StatusForbidden, messages.MsgDenied, logId, nil)
		res.Error = "unauthorized"
		ctx.JSON(http.StatusForbidden, res)
		return
	}

	if err := h.Service.DestroySession(context.Background(), sessionID); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DestroySession; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Session revoked successfully", logId, nil)
	ctx.JSON(http.StatusOK, res)
}

// RevokeAllOtherSessions godoc
// @Summary Revoke all other sessions except current
// @Description Logout from all devices except the current one
// @Tags Sessions
// @Accept  json
// @Produce  json
// @Success 200 {object} response.Success
// @Failure 401 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user/sessions/revoke-others [post]
func (h *HandlerSession) RevokeAllOtherSessions(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SessionHandler][RevokeAllOtherSessions]", logId)

	userID, ok := ctx.Get("userId")
	if !ok {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; userId not found in context", logPrefix))
		res := response.Response(http.StatusUnauthorized, messages.MsgFail, logId, nil)
		res.Error = "user not authenticated"
		ctx.JSON(http.StatusUnauthorized, res)
		return
	}

	// Get current session ID
	token, _ := ctx.Get("token")
	currentSession, err := h.Service.GetSessionByToken(context.Background(), token.(string))
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetSessionByToken; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = "failed to get current session"
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	if err := h.Service.DestroyOtherSessions(context.Background(), userID.(string), currentSession.SessionID); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DestroyOtherSessions; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "All other sessions revoked successfully", logId, nil)
	ctx.JSON(http.StatusOK, res)
}
