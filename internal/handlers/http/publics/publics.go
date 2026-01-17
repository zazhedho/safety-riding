package handlerpublic

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	interfacespublic "safety-riding/internal/interfaces/publics"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PublicHandler struct {
	Service interfacespublic.ServicePublicInterface
}

func NewPublicHandler(s interfacespublic.ServicePublicInterface) *PublicHandler {
	return &PublicHandler{
		Service: s,
	}
}

// AddPublic godoc
// @Summary Create a public entity
// @Description Create a new public entity record
// @Tags Publics
// @Accept json
// @Produce json
// @Param public body dto.AddPublic true "Public payload"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /public [post]
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

// GetPublicById godoc
// @Summary Get public entity detail
// @Description Retrieve public entity by ID
// @Tags Publics
// @Accept json
// @Produce json
// @Param id path string true "Public entity ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /public/{id} [get]
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

// UpdatePublic godoc
// @Summary Update a public entity
// @Description Update public entity information by ID
// @Tags Publics
// @Accept json
// @Produce json
// @Param id path string true "Public entity ID"
// @Param public body dto.UpdatePublic true "Public payload"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /public/{id} [put]
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

// FetchPublic godoc
// @Summary List public entities
// @Description Retrieve paginated public entities with optional filters
// @Tags Publics
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param sort query string false "Sort field"
// @Param order query string false "Sort order (asc/desc)"
// @Param district_id query string false "Filter by district ID"
// @Param city_id query string false "Filter by city ID"
// @Param province_id query string false "Filter by province ID"
// @Param category query string false "Filter by category"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /publics [get]
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
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, int(totalData)))
	ctx.JSON(http.StatusOK, res)

}

// DeletePublic godoc
// @Summary Delete a public entity
// @Description Delete public entity by ID
// @Tags Publics
// @Accept json
// @Produce json
// @Param id path string true "Public entity ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /public/{id} [delete]
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

// GetEducationStats godoc
// @Summary Get public education statistics
// @Description Retrieve aggregated education statistics for public entities
// @Tags Publics
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param district_id query string false "Filter by district ID"
// @Param city_id query string false "Filter by city ID"
// @Param province_id query string false "Filter by province ID"
// @Param category query string false "Filter by category"
// @Param is_educated query string false "Filter by education flag"
// @Param month query string false "Filter by month"
// @Param year query string false "Filter by year"
// @Param sort query string false "Sort field"
// @Param order query string false "Sort order (asc/desc)"
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /publics/education-stats [get]
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

// GetSummary godoc
// @Summary Get publics summary
// @Description Retrieve total counts for public entities and employees
// @Tags Publics
// @Produce json
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /publics/summary [get]
func (h *PublicHandler) GetSummary(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PublicHandler][GetSummary]", logId)

	summary, err := h.Service.GetSummary()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get publics summary successfully", logId, summary)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %v", logPrefix, utils.JsonEncode(summary)))
	ctx.JSON(http.StatusOK, res)
}

// GetForMap godoc
// @Summary Get publics for map display
// @Description Retrieve minimal public entity data for map markers
// @Tags Publics
// @Produce json
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /publics/map [get]
func (h *PublicHandler) GetForMap(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)

	publics, err := h.Service.GetForMap()
	if err != nil {
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get publics for map successfully", logId, publics)
	ctx.JSON(http.StatusOK, res)
}
