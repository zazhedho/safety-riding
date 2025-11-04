package handlerbudget

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	"safety-riding/internal/services/budget"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BudgetHandler struct {
	Service *servicebudget.BudgetService
}

func NewBudgetHandler(s *servicebudget.BudgetService) *BudgetHandler {
	return &BudgetHandler{
		Service: s,
	}
}

func (h *BudgetHandler) AddBudget(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][AddBudget]", logId)

	var req dto.AddEventBudget
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.AddBudget(username, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AddBudget; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Add budget successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

func (h *BudgetHandler) GetBudgetById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][GetBudgetById]", logId)

	budgetId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetBudgetById(budgetId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetBudgetById; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "budget data not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get budget successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v", logId, nil))
	ctx.JSON(http.StatusOK, res)
}

func (h *BudgetHandler) UpdateBudget(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	role := utils.InterfaceString(authData["role"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][UpdateBudget]", logId)

	budgetId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdateEventBudget
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.UpdateBudget(budgetId, username, role, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdateBudget; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Update budget successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

func (h *BudgetHandler) FetchBudget(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][FetchBudget]", logId)

	params, _ := filter.GetBaseParams(ctx, "budget_date", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"event_id", "budget_month", "budget_year", "category", "status"})

	budgets, totalData, err := h.Service.FetchBudget(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "List budget not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, budgets)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(budgets)))
	ctx.JSON(http.StatusOK, res)
}

func (h *BudgetHandler) DeleteBudget(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][DeleteBudget]", logId)

	id := ctx.Param("id")
	if id == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing budget ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "Budget ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if err := h.Service.DeleteBudget(id, username); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeleteBudget; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Delete budget successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success;", logPrefix))
	ctx.JSON(http.StatusOK, res)
}

// Aggregation handlers
func (h *BudgetHandler) GetBudgetsByEvent(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][GetBudgetsByEvent]", logId)

	eventId := ctx.Param("eventId")
	if eventId == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing event ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "Event ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.GetBudgetsByEvent(eventId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetBudgetsByEvent; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get budgets by event successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *BudgetHandler) GetBudgetsByMonthYear(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][GetBudgetsByMonthYear]", logId)

	monthStr := ctx.Query("month")
	yearStr := ctx.Query("year")

	if monthStr == "" || yearStr == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing month or year", logPrefix))
		res := response.Response(http.StatusBadRequest, "Month and year are required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil || month < 1 || month > 12 {
		res := response.Response(http.StatusBadRequest, "Invalid month (must be 1-12)", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		res := response.Response(http.StatusBadRequest, "Invalid year", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.GetBudgetsByMonthYear(month, year)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetBudgetsByMonthYear; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get budgets by month/year successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *BudgetHandler) GetMonthlySummary(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][GetMonthlySummary]", logId)

	monthStr := ctx.Query("month")
	yearStr := ctx.Query("year")

	if monthStr == "" || yearStr == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing month or year", logPrefix))
		res := response.Response(http.StatusBadRequest, "Month and year are required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil || month < 1 || month > 12 {
		res := response.Response(http.StatusBadRequest, "Invalid month (must be 1-12)", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		res := response.Response(http.StatusBadRequest, "Invalid year", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.GetMonthlySummary(month, year)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetMonthlySummary; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get monthly summary successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *BudgetHandler) GetYearlySummary(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][GetYearlySummary]", logId)

	yearStr := ctx.Query("year")

	if yearStr == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing year", logPrefix))
		res := response.Response(http.StatusBadRequest, "Year is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		res := response.Response(http.StatusBadRequest, "Invalid year", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.GetYearlySummary(year)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetYearlySummary; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get yearly summary successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *BudgetHandler) GetEventSummary(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][BudgetHandler][GetEventSummary]", logId)

	eventId := ctx.Param("eventId")
	if eventId == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing event ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "Event ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.GetEventSummary(eventId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetEventSummary; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get event summary successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}
