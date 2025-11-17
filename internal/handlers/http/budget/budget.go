package handlerbudget

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	interfacebudget "safety-riding/internal/interfaces/budget"
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
	Service interfacebudget.ServiceBudgetInterface
}

func NewBudgetHandler(s interfacebudget.ServiceBudgetInterface) *BudgetHandler {
	return &BudgetHandler{
		Service: s,
	}
}

// AddBudget godoc
// @Summary Create a new budget entry
// @Description Create a new event budget record
// @Tags Budgets
// @Accept json
// @Produce json
// @Param budget body dto.AddEventBudget true "Budget payload"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budget [post]
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

// GetBudgetById godoc
// @Summary Get budget detail
// @Description Retrieve a single budget entry by ID
// @Tags Budgets
// @Accept json
// @Produce json
// @Param id path string true "Budget ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budget/{id} [get]
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

// UpdateBudget godoc
// @Summary Update a budget entry
// @Description Update budget information by ID
// @Tags Budgets
// @Accept json
// @Produce json
// @Param id path string true "Budget ID"
// @Param budget body dto.UpdateEventBudget true "Budget payload"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budget/{id} [put]
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

// FetchBudget godoc
// @Summary List budgets with pagination
// @Description Retrieve paginated budgets with optional filters
// @Tags Budgets
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param sort query string false "Sort field"
// @Param order query string false "Sort order (asc/desc)"
// @Param event_id query string false "Filter by event ID"
// @Param budget_month query string false "Filter by month"
// @Param budget_year query string false "Filter by year"
// @Param category query string false "Filter by category"
// @Param status query string false "Filter by status"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budgets [get]
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

// DeleteBudget godoc
// @Summary Delete a budget entry
// @Description Delete budget by ID
// @Tags Budgets
// @Accept json
// @Produce json
// @Param id path string true "Budget ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budget/{id} [delete]
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

// GetBudgetsByEvent godoc
// @Summary List budgets for an event
// @Description Retrieve all budgets grouped by a specific event ID
// @Tags Budgets
// @Accept json
// @Produce json
// @Param eventId path string true "Event ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budgets/event/{eventId} [get]
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

// GetBudgetsByMonthYear godoc
// @Summary List budgets by month and year
// @Description Retrieve budgets filtered by month and year
// @Tags Budgets
// @Accept json
// @Produce json
// @Param month query int true "Month number (1-12)"
// @Param year query int true "Year"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budgets/month-year [get]
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

// GetMonthlySummary godoc
// @Summary Get monthly budget summary
// @Description Retrieve aggregated monthly budget summary data
// @Tags Budgets
// @Accept json
// @Produce json
// @Param month query int true "Month number (1-12)"
// @Param year query int true "Year"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budget/summary/monthly [get]
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

// GetYearlySummary godoc
// @Summary Get yearly budget summary
// @Description Retrieve aggregated yearly budget summary data
// @Tags Budgets
// @Accept json
// @Produce json
// @Param year query int true "Year"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budget/summary/yearly [get]
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

// GetEventSummary godoc
// @Summary Get event budget summary
// @Description Retrieve aggregated budget summary for a specific event
// @Tags Budgets
// @Accept json
// @Produce json
// @Param eventId path string true "Event ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /budget/summary/event/{eventId} [get]
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
