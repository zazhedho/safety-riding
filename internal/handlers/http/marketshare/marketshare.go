package handlermarketshare

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	interfacemarketshare "safety-riding/internal/interfaces/marketshare"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MarketShareHandler struct {
	Service interfacemarketshare.ServiceMarketShareInterface
}

func NewMarketShareHandler(s interfacemarketshare.ServiceMarketShareInterface) *MarketShareHandler {
	return &MarketShareHandler{
		Service: s,
	}
}

// AddMarketShare godoc
// @Summary Create market share entry
// @Description Create a new market share record
// @Tags MarketShare
// @Accept json
// @Produce json
// @Param marketshare body dto.AddMarketShare true "Market share payload"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /marketshare [post]
func (h *MarketShareHandler) AddMarketShare(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MarketShareHandler][AddMarketShare]", logId)

	var req dto.AddMarketShare
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.AddMarketShare(username, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AddMarketShare; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Add market share successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// GetMarketShareById godoc
// @Summary Get market share detail
// @Description Retrieve market share data by ID
// @Tags MarketShare
// @Accept json
// @Produce json
// @Param id path string true "Market share ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /marketshare/{id} [get]
func (h *MarketShareHandler) GetMarketShareById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MarketShareHandler][GetMarketShareById]", logId)

	marketShareId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetMarketShareById(marketShareId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetMarketShareById; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "market share data not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get market share successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v", logId, nil))
	ctx.JSON(http.StatusOK, res)
}

// UpdateMarketShare godoc
// @Summary Update market share entry
// @Description Update market share record by ID
// @Tags MarketShare
// @Accept json
// @Produce json
// @Param id path string true "Market share ID"
// @Param marketshare body dto.UpdateMarketShare true "Market share payload"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /marketshare/{id} [put]
func (h *MarketShareHandler) UpdateMarketShare(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MarketShareHandler][UpdateMarketShare]", logId)

	marketShareId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdateMarketShare
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.UpdateMarketShare(marketShareId, username, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdateMarketShare; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Update market share successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// FetchMarketShare godoc
// @Summary List market share data
// @Description Retrieve paginated market share entries with optional filters
// @Tags MarketShare
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param sort query string false "Sort field"
// @Param order query string false "Sort order (asc/desc)"
// @Param province_id query string false "Filter by province ID"
// @Param city_id query string false "Filter by city ID"
// @Param district_id query string false "Filter by district ID"
// @Param month query string false "Filter by month"
// @Param year query string false "Filter by year"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /marketshares [get]
func (h *MarketShareHandler) FetchMarketShare(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MarketShareHandler][FetchMarketShare]", logId)

	params, _ := filter.GetBaseParams(ctx, "created_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"province_id", "city_id", "district_id", "month", "year"})

	marketShares, totalData, err := h.Service.FetchMarketShare(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "List market share not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, marketShares)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(marketShares)))
	ctx.JSON(http.StatusOK, res)
}

// DeleteMarketShare godoc
// @Summary Delete a market share entry
// @Description Delete market share record by ID
// @Tags MarketShare
// @Accept json
// @Produce json
// @Param id path string true "Market share ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /marketshare/{id} [delete]
func (h *MarketShareHandler) DeleteMarketShare(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MarketShareHandler][DeleteMarketShare]", logId)

	id := ctx.Param("id")
	if id == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing market share ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "Market share ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if err := h.Service.DeleteMarketShare(id, username); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeleteMarketShare; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Delete market share successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success;", logPrefix))
	ctx.JSON(http.StatusOK, res)
}

// GetTopDistricts godoc
// @Summary Get top districts
// @Description Retrieve top districts ranked by sales
// @Tags MarketShare
// @Accept json
// @Produce json
// @Param year query int false "Year filter"
// @Param month query int false "Month filter (1-12)"
// @Param limit query int false "Number of records (default 5)"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /marketshare/top-districts [get]
func (h *MarketShareHandler) GetTopDistricts(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MarketShareHandler][GetTopDistricts]", logId)

	yearStr := ctx.Query("year")
	monthStr := ctx.Query("month")
	limitStr := ctx.DefaultQuery("limit", "5")

	var year, month int
	var err error

	if yearStr != "" {
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			res := response.Response(http.StatusBadRequest, "Invalid year", logId, nil)
			ctx.JSON(http.StatusBadRequest, res)
			return
		}
	}

	if monthStr != "" {
		month, err = strconv.Atoi(monthStr)
		if err != nil || month < 1 || month > 12 {
			res := response.Response(http.StatusBadRequest, "Invalid month (must be 1-12)", logId, nil)
			ctx.JSON(http.StatusBadRequest, res)
			return
		}
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 5
	}

	data, err := h.Service.GetTopDistricts(year, month, limit)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetTopDistricts; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get top districts successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

// GetSummary godoc
// @Summary Get market share summary
// @Description Retrieve aggregated market share summary by hierarchy level
// @Tags MarketShare
// @Accept json
// @Produce json
// @Param level query string false "Aggregation level (province/city/district)"
// @Param year query int false "Year filter"
// @Param month query int false "Month filter (1-12)"
// @Param province_id query string false "Province ID filter"
// @Param city_id query string false "City ID filter"
// @Param district_id query string false "District ID filter"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /marketshare/summary [get]
func (h *MarketShareHandler) GetSummary(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MarketShareHandler][GetSummary]", logId)

	level := ctx.DefaultQuery("level", "province")
	yearStr := ctx.Query("year")
	monthStr := ctx.Query("month")
	provinceID := ctx.Query("province_id")
	cityID := ctx.Query("city_id")
	districtID := ctx.Query("district_id")

	var (
		year  int
		month int
		err   error
	)

	if yearStr != "" {
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			res := response.Response(http.StatusBadRequest, "Invalid year", logId, nil)
			ctx.JSON(http.StatusBadRequest, res)
			return
		}
	}

	if monthStr != "" {
		month, err = strconv.Atoi(monthStr)
		if err != nil || month < 1 || month > 12 {
			res := response.Response(http.StatusBadRequest, "Invalid month (must be 1-12)", logId, nil)
			ctx.JSON(http.StatusBadRequest, res)
			return
		}
	}

	data, err := h.Service.GetSummary(level, year, month, provinceID, cityID, districtID)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetSummary; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get market share summary successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

// GetDashboardSuggestions godoc
// @Summary Get dashboard suggestions
// @Description Retrieve top cities and districts suggestions for dashboard insights
// @Tags MarketShare
// @Accept json
// @Produce json
// @Param year query int false "Year filter"
// @Param month query int false "Month filter (1-12)"
// @Param city_limit query int false "Number of cities to return (default 5)"
// @Param district_limit query int false "Number of districts to return (default 5)"
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /marketshare/dashboard-suggestions [get]
func (h *MarketShareHandler) GetDashboardSuggestions(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MarketShareHandler][GetDashboardSuggestions]", logId)

	now := time.Now()
	year := now.Year()
	month := int(now.Month())

	if yearStr := ctx.Query("year"); yearStr != "" {
		if parsed, err := strconv.Atoi(yearStr); err == nil {
			year = parsed
		}
	}

	if monthStr := ctx.Query("month"); monthStr != "" {
		if parsed, err := strconv.Atoi(monthStr); err == nil && parsed >= 1 && parsed <= 12 {
			month = parsed
		}
	}

	cityLimit := 5
	if limitStr := ctx.Query("city_limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			cityLimit = parsed
		}
	}

	districtLimit := 5
	if limitStr := ctx.Query("district_limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			districtLimit = parsed
		}
	}

	topCities, err := h.Service.GetTopCities(year, month, cityLimit)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetTopCities; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	topDistricts, err := h.Service.GetTopDistricts(year, month, districtLimit)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetTopDistricts; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	payload := map[string]interface{}{
		"year":           year,
		"month":          month,
		"top_cities":     topCities,
		"top_districts":  topDistricts,
		"city_limit":     cityLimit,
		"district_limit": districtLimit,
	}

	res := response.Response(http.StatusOK, "Get market share suggestions successfully", logId, payload)
	ctx.JSON(http.StatusOK, res)
}
