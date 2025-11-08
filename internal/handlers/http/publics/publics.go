package handlersPublic

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	servicepublic "safety-riding/internal/services/publics"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PublicHandler struct {
	Service *servicepublic.PublicService
}

func NewPublicHandler(s *servicepublic.PublicService) *PublicHandler {
	return &PublicHandler{
		Service: s,
	}
}

func (h *PublicHandler) AddPublic(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PublicHandler][AddPublic]", logId)

	var req dto.AddPublic
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.AddPublic(username, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AddPublic; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Add public entity successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

func (h *PublicHandler) GetPublicById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PublicHandler][GetPublicById]", logId)

	publicId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetPublicById(publicId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetPublicById; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "public entity data not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get public entity successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v", logId, nil))
	ctx.JSON(http.StatusOK, res)
}

func (h *PublicHandler) UpdatePublic(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PublicHandler][UpdatePublic]", logId)

	publicId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdatePublic
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.UpdatePublic(publicId, username, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdatePublic; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Update public entity successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

func (h *PublicHandler) FetchPublic(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PublicHandler][FetchPublic]", logId)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistStringFilter(params.Filters, []string{"district_id", "city_id", "province_id", "category"})

	publics, totalData, err := h.Service.FetchPublic(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "List public entity not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, publics)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(publics)))
	ctx.JSON(http.StatusOK, res)

}

func (h *PublicHandler) DeletePublic(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PublicHandler][DeletePublic]", logId)

	id := ctx.Param("id")
	if id == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing public entity ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "Public entity ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if err := h.Service.DeletePublic(id, username); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeletePublic; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Delete public entity successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success;", logPrefix))
	ctx.JSON(http.StatusOK, res)
}

func (h *PublicHandler) GetEducationStats(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PublicHandler][GetEducationStats]", logId)

	params, _ := filter.GetBaseParams(ctx, "name", "asc", 10)
	params.Filters = filter.WhitelistStringFilter(params.Filters, []string{"district_id", "city_id", "province_id", "category", "is_educated", "month", "year"})

	stats, err := h.Service.GetEducationStats(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetEducationStats; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get public education statistics successfully", logId, stats)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: total publics=%d, total employees educated=%d", logId, stats.TotalPublics, stats.TotalAllEmployees))
	ctx.JSON(http.StatusOK, res)
}
