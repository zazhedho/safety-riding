package handlerapprovalrecord

import (
	"fmt"
	"net/http"
	interfaceapprovalrecord "safety-riding/internal/interfaces/approvalrecord"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

type ApprovalRecordHandler struct {
	Service interfaceapprovalrecord.ServiceApprovalRecordInterface
}

func NewApprovalRecordHandler(s interfaceapprovalrecord.ServiceApprovalRecordInterface) *ApprovalRecordHandler {
	return &ApprovalRecordHandler{Service: s}
}

func (h *ApprovalRecordHandler) Fetch(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][ApprovalRecordHandler][Fetch]", logID)

	params, _ := filter.GetBaseParams(ctx, "submitted_at", "desc", 10)
	params.Filters = filter.WhitelistStringFilter(params.Filters, []string{"latest_status"})

	data, totalData, err := h.Service.Fetch(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Fetch; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logID, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *ApprovalRecordHandler) GetByID(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][ApprovalRecordHandler][GetByID]", logID)

	data, err := h.Service.GetByID(ctx.Param("id"))
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetByID; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusNotFound, "Approval record not found", logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusOK, messages.MsgSuccess, logID, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *ApprovalRecordHandler) Sync(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logID := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][ApprovalRecordHandler][Sync]", logID)

	force := strings.EqualFold(ctx.DefaultQuery("force", "false"), "true")
	data, err := h.Service.Sync(username, force)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Sync; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Sync approval data successfully", logID, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *ApprovalRecordHandler) GetSourceConfig(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][ApprovalRecordHandler][GetSourceConfig]", logID)

	data, err := h.Service.GetSourceConfig()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetSourceConfig; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, messages.MsgSuccess, logID, data)
	ctx.JSON(http.StatusOK, res)
}
