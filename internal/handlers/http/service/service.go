package service

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"workshop-management/internal/dto"
	"workshop-management/internal/services/service"
	"workshop-management/pkg/filter"
	"workshop-management/pkg/logger"
	"workshop-management/pkg/messages"
	"workshop-management/pkg/response"
	"workshop-management/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HandlerService (Service = jasa), not service layer
type HandlerService struct {
	Service *service.SrvService
}

func NewServiceHandler(s *service.SrvService) *HandlerService {
	return &HandlerService{Service: s}
}

// Create godoc
// @Summary Create a new service
// @Description Create a new service with the given information
// @Tags Services
// @Accept json
// @Produce json
// @Param service body dto.AddService true "Service information"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /service [post]
func (h *HandlerService) Create(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerService][Create]", logId)

	var req dto.AddService
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

	res := response.Response(http.StatusCreated, "Add service successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// Fetch godoc
// @Summary Fetch services
// @Description Fetch services with optional filters
// @Tags Services
// @Accept json
// @Produce json
// @Param page query int false "Page number for pagination"
// @Param limit query int false "Number of items per page"
// @Param order_by query string false "Field to sort by"
// @Param order_direction query string false "Sort direction (asc/desc)"
// @Param search query string false "Search query to filter services"
// @Param filters[price] query string false "Filter by price"
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Router /services [get]
func (h *HandlerService) Fetch(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerService][Fetch]", logId)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"price"})

	data, totalData, err := h.Service.Fetch(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// GetById godoc
// @Summary Get a service by ID
// @Description Get a service by its ID
// @Tags Services
// @Accept json
// @Produce json
// @Param id path string true "Service ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /service/{id} [get]
func (h *HandlerService) GetById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerService][GetById]", logId)

	serviceId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetById(serviceId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetById; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "service not found"
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

// Update godoc
// @Summary Update a service
// @Description Update a service with the given information
// @Tags Services
// @Accept json
// @Produce json
// @Param id path string true "Service ID"
// @Param service body dto.UpdateService true "Service information"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /service/{id} [put]
// @Security ApiKeyAuth
func (h *HandlerService) Update(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerService][Update]", logId)
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	serviceId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdateService
	if err = ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	rows, err := h.Service.Update(userId, serviceId, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Update; Error: %+v", logPrefix, err))
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

	res := response.Response(http.StatusOK, fmt.Sprintf("Service with ID: '%s' updated successfully", serviceId), logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Service with ID: '%s' updated successfully; Data: %v", logPrefix, serviceId, utils.JsonEncode(req)))
	ctx.JSON(http.StatusOK, res)
	return
}

// Delete godoc
// @Summary Delete a service
// @Description Delete a service by its ID
// @Tags Services
// @Accept json
// @Produce json
// @Param id path string true "Service ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /service/{id} [delete]
// @Security ApiKeyAuth
func (h *HandlerService) Delete(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerService][Delete]", logId)
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	serviceId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	if err = h.Service.Delete(userId, serviceId); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Delete; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: messages.NotFound}
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, fmt.Sprintf("Service with ID: '%s' deleted successfully", serviceId), logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Service with ID: '%s' deleted successfully", logPrefix, serviceId))
	ctx.JSON(http.StatusOK, res)
	return
}
