package booking

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"workshop-management/internal/dto"
	"workshop-management/internal/services/booking"
	"workshop-management/pkg/filter"
	"workshop-management/pkg/logger"
	"workshop-management/pkg/messages"
	"workshop-management/pkg/response"
	"workshop-management/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HandlerBooking struct {
	Service *booking.ServiceBooking
}

func NewBookingHandler(s *booking.ServiceBooking) *HandlerBooking {
	return &HandlerBooking{Service: s}
}

// Create godoc
// @Summary      Create a new booking
// @Description  Create a new booking with the provided details.
// @Tags         Bookings
// @Accept       json
// @Produce      json
// @Param        booking  body      dto.CreateBooking  true  "Booking details to be created"
// @Success      201      {object}  response.Success  "Booking created successfully"
// @Failure      400      {object}  response.Error    "Invalid request body"
// @Failure      500      {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /booking [post]
func (h *HandlerBooking) Create(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerBooking][Create]", logId)

	var req dto.CreateBooking
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))

		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.Create(userId, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Create; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Create booking successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// GetBookingById godoc
// @Summary      Get a booking by ID
// @Description  Retrieve booking details using the booking ID.
// @Tags         Bookings
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Booking ID"
// @Success      200  {object}  response.Success  "Booking details retrieved successfully"
// @Failure      404  {object}  response.Error    "Booking not found"
// @Failure      500  {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /booking/{id} [get]
func (h *HandlerBooking) GetBookingById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerBooking][GetBookingById]", logId)

	bookingId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetByID(bookingId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetByID; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "booking not found"
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

// Fetch godoc
// @Summary      Get a list of bookings
// @Description  Retrieve a list of bookings with optional filters and pagination.
// @Tags         Bookings
// @Accept       json
// @Produce      json
// @Param        page             query     int     false  "Page number for pagination"
// @Param        limit            query     int     false  "Number of items per page"
// @Param        order_by         query     string  false  "Field to sort by"
// @Param        order_direction  query     string  false  "Sort direction (asc/desc)"
// @Param        search           query     string  false  "Search query to filter bookings"
// @Param        filters[status]  query     string  false  "Filter by booking status"
// @Param        filters[user_id] query     string  false  "Filter by user ID"
// @Success      200              {object}  response.Success  "List of bookings retrieved successfully"
// @Failure      404              {object}  response.Error    "No bookings found"
// @Failure      500              {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /bookings [get]
func (h *HandlerBooking) Fetch(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerBooking][Fetch]", logId)
	authData := utils.GetAuthData(ctx)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"user_id", "status"})

	userId := utils.InterfaceString(authData["user_id"])
	if utils.InterfaceString(authData["role"]) == utils.RoleCustomer {
		params.Filters["user_id"] = userId
	}

	bookings, totalData, err := h.Service.Fetch(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "List booking not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, bookings)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(bookings)))
	ctx.JSON(http.StatusOK, res)
}

// UpdateStatus godoc
// @Summary      Update status a booking
// @Description  Update status a booking with the provided details.
// @Tags         Bookings
// @Accept       json
// @Produce      json
// @Param        id       path      string            true  "Booking ID"
// @Param        booking  body      dto.UpdateBookingStatus true  "Booking details to be updated"
// @Success      200      {object}  response.Success  "Booking updated successfully"
// @Failure      400      {object}  response.Error    "Invalid request body"
// @Failure      404      {object}  response.Error    "Booking not found"
// @Failure      500      {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /booking/{id}/status [put]
func (h *HandlerBooking) UpdateStatus(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerBooking][Update]", logId)
	authData := utils.GetAuthData(ctx)
	role := utils.InterfaceString(authData["role"])
	userId := utils.InterfaceString(authData["user_id"])

	bookingId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdateBookingStatus
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	rows, err := h.Service.UpdateStatus(bookingId, userId, role, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Update; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	if rows == 0 {
		res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
		res.Error = response.Errors{Code: http.StatusNotFound, Message: messages.NotFound}
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusOK, fmt.Sprintf("Booking with ID: '%s' updated successfully", bookingId), logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(map[string]interface{}{"id": bookingId, "status": req.Status})))
	ctx.JSON(http.StatusOK, res)
}
