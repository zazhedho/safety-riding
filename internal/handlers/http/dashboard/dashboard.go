package handlerdashboard

import (
	"fmt"
	"net/http"

	interfacedashboard "safety-riding/internal/interfaces/dashboard"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	DashboardService interfacedashboard.ServiceDashboardInterface
}

func NewDashboardHandler(dashboardService interfacedashboard.ServiceDashboardInterface) *DashboardHandler {
	return &DashboardHandler{DashboardService: dashboardService}
}

// GetStats godoc
// @Summary Get dashboard statistics
// @Description Get aggregated statistics for dashboard (current + previous month)
// @Tags Dashboard
// @Accept json
// @Produce json
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /api/dashboard/stats [get]
func (h *DashboardHandler) GetStats(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][DashboardHandler][GetStats]", logId)

	stats, err := h.DashboardService.GetStats()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Error: %v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgErr, logId, nil)
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, messages.MsgSuccess, logId, stats)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v", logPrefix, stats))
	ctx.JSON(http.StatusOK, res)
}
