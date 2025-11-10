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

// GetTopDistricts returns top districts by sales for dashboard
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

// GetSummary returns aggregated summaries by level (province/city/district)
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

// GetDashboardSuggestions returns top cities and districts for dashboard insights
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
