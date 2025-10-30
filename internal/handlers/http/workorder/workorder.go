package workorder

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"workshop-management/internal/domain/workorder"
	"workshop-management/internal/dto"
	"workshop-management/pkg/filter"
	"workshop-management/pkg/logger"
	"workshop-management/pkg/messages"
	"workshop-management/pkg/response"
	"workshop-management/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HandlerWorkOrder struct {
	Service workorder.Service
}

func NewWorkOrderHandler(s workorder.Service) *HandlerWorkOrder {
	return &HandlerWorkOrder{
		Service: s,
	}
}

// Fetch godoc
// @Summary Get all work orders
// @Description Get all work orders
// @Tags Work Orders
// @Accept json
// @Produce json
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Router /workorders [get]
// @Security Bearer
func (h *HandlerWorkOrder) Fetch(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][WorkOrderHandler][Fetch]", logId)
	authData := utils.GetAuthData(ctx)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"status"})

	userId := utils.InterfaceString(authData["user_id"])
	if utils.InterfaceString(authData["role"]) == utils.RoleCustomer {
		params.Filters["customer_id"] = userId
	}

	data, totalData, err := h.Service.Fetch(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "work order not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// CreateFromBooking godoc
// @Summary Create a work order from a booking
// @Description Create a new work order from an existing booking ID
// @Tags Work Orders
// @Accept json
// @Produce json
// @Param id path string true "Booking ID"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /workorders/from-booking/{id} [post]
// @Security Bearer
func (h *HandlerWorkOrder) CreateFromBooking(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][WorkOrderHandler][CreateFromBooking]", logId)

	bookingId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.CreateFromBooking(bookingId, userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; CreateFromBooking; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "success", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// AssignMechanic godoc
// @Summary Assign a mechanic to a work order
// @Description Assign a mechanic to an existing work order
// @Tags Work Orders
// @Accept json
// @Produce json
// @Param id path string true "Work Order ID"
// @Param mechanic body dto.AssignMechanic true "Mechanic information"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /workorders/{id}/assign-mechanic [put]
// @Security Bearer
func (h *HandlerWorkOrder) AssignMechanic(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][WorkOrderHandler][AssignMechanic]", logId)
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	workOrderId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}
	var req dto.AssignMechanic
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	rows, err := h.Service.AssignMechanic(req, workOrderId, userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AssignMechanic; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}
	if rows == 0 {
		res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
		res.Error = response.Errors{Code: http.StatusNotFound, Message: messages.NotFound}
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusOK, "success", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(res)))
	ctx.JSON(http.StatusOK, res)
}

// GetById godoc
// @Summary Get a work order by ID
// @Description Get a work order by ID
// @Tags Work Orders
// @Accept json
// @Produce json
// @Param id path string true "Work Order ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /workorder/{id} [get]
// @Security Bearer
func (h *HandlerWorkOrder) GetById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][WorkOrderHandler][GetById]", logId)

	workOrderId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetById(workOrderId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetById; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "work order not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "success", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// UpdateStatus godoc
// @Summary Update a work order status
// @Description Update the status of an existing work order
// @Tags Work Orders
// @Accept json
// @Produce json
// @Param id path string true "Work Order ID"
// @Param status body dto.UpdateStatus true "New status"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /workorders/{id}/status [put]
// @Security Bearer
func (h *HandlerWorkOrder) UpdateStatus(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][WorkOrderHandler][UpdateStatus]", logId)
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	workOrderId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdateStatus
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	rows, err := h.Service.UpdateStatus(workOrderId, req.Status, userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdateStatus; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}
	if rows == 0 {
		res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
		res.Error = response.Errors{Code: http.StatusNotFound, Message: messages.NotFound}
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusOK, "success", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(res)))
	ctx.JSON(http.StatusOK, res)
}
