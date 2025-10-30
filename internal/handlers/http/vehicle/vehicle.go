package vehicle

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"strconv"
	"workshop-management/internal/dto"
	"workshop-management/internal/services/vehicle"
	"workshop-management/pkg/filter"
	"workshop-management/pkg/logger"
	"workshop-management/pkg/messages"
	"workshop-management/pkg/response"
	"workshop-management/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HandlerVehicle struct {
	Service *vehicle.ServiceVehicle
}

func NewVehicleHandler(s *vehicle.ServiceVehicle) *HandlerVehicle {
	return &HandlerVehicle{Service: s}
}

// Create godoc
// @Summary      Create a new vehicle
// @Description  Create a new vehicle with the provided details.
// @Tags         Vehicles
// @Accept       json
// @Produce      json
// @Param        vehicle  body      dto.AddVehicle  true  "Vehicle details to be created"
// @Success      201      {object}  response.Success  "Vehicle created successfully"
// @Failure      400      {object}  response.Error    "Invalid request body"
// @Failure      500      {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /vehicle [post]
func (h *HandlerVehicle) Create(ctx *gin.Context) {
	var req dto.AddVehicle
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerVehicle][Create]", logId)

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
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Error: License plate already exists", logPrefix))
			res := response.Response(http.StatusBadRequest, messages.MsgExists, logId, nil)
			res.Error = response.Errors{Code: http.StatusBadRequest, Message: "license plate already exists"}
			ctx.JSON(http.StatusBadRequest, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Add vehicle successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// GetById godoc
// @Summary      Get a vehicle by ID
// @Description  Retrieve vehicle details using the vehicle ID.
// @Tags         Vehicles
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Vehicle ID"
// @Success      200  {object}  response.Success  "Vehicle details retrieved successfully"
// @Failure      404  {object}  response.Error    "Vehicle not found"
// @Failure      500  {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /vehicle/{id} [get]
func (h *HandlerVehicle) GetById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerVehicle][GetById]", logId)

	vehicleId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetById(vehicleId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetById; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "vehicle not found"
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
// @Summary      Get a list of vehicles
// @Description  Retrieve a list of vehicles with optional filters and pagination.
// @Tags         Vehicles
// @Accept       json
// @Produce      json
// @Param        page            query     int     false  "Page number for pagination"
// @Param        limit           query     int     false  "Number of items per page"
// @Param        order_by        query     string  false  "Field to sort by"
// @Param        order_direction query     string  false  "Sort direction (asc/desc)"
// @Param        search          query     string  false  "Search query to filter vehicles"
// @Success      200             {object}  response.Success  "List of vehicles retrieved successfully"
// @Failure      404             {object}  response.Error    "No vehicles found"
// @Failure      500             {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /vehicles [get]
func (h *HandlerVehicle) Fetch(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerVehicle][Fetch]", logId)
	authData := utils.GetAuthData(ctx)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"user_id", "brand", "model", "year", "color"})

	userId := utils.InterfaceString(authData["user_id"])
	if utils.InterfaceString(authData["role"]) == utils.RoleCustomer {
		params.Filters["user_id"] = userId
	}
	if params.Filters["year"] != nil {
		params.Filters["year"] = strconv.Itoa(int(params.Filters["year"].(float64)))
	}

	vehicles, totalData, err := h.Service.Fetch(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "List vehicle not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, vehicles)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(vehicles)))
	ctx.JSON(http.StatusOK, res)
}

// Update godoc
// @Summary      Update a vehicle
// @Description  Update an existing vehicle's details.
// @Tags         Vehicles
// @Accept       json
// @Produce      json
// @Param        id       path      string          true  "Vehicle ID"
// @Param        vehicle  body      dto.UpdateVehicle  true  "Updated vehicle details"
// @Success      200      {object}  response.Success  "Vehicle updated successfully"
// @Failure      400      {object}  response.Error    "Invalid request body"
// @Failure      404      {object}  response.Error    "Vehicle not found"
// @Failure      500      {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /vehicle/{id} [put]
func (h *HandlerVehicle) Update(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerVehicle][Update]", logId)
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	vehicleId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdateVehicle
	if err = ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	rows, err := h.Service.Update(vehicleId, userId, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Update; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; License plate: '%s' already exists", logPrefix, req.LicensePlate))
			res := response.Response(http.StatusBadRequest, messages.MsgExists, logId, nil)
			res.Error = response.Errors{Code: http.StatusBadRequest, Message: fmt.Sprintf("License plate: '%s' is already exists", req.LicensePlate)}
			ctx.JSON(http.StatusBadRequest, res)
			return
		}

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

	res := response.Response(http.StatusOK, fmt.Sprintf("Vehicle with ID: '%s' updated successfully", vehicleId), logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Vehicle with ID: '%s' updated successfully; Data: %v", logPrefix, vehicleId, utils.JsonEncode(req)))
	ctx.JSON(http.StatusOK, res)
}

// Delete godoc
// @Summary      Delete a vehicle
// @Description  Delete a vehicle by its ID.
// @Tags         Vehicles
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "Vehicle ID"
// @Success      200  {object}  response.Success  "Vehicle deleted successfully"
// @Failure      404  {object}  response.Error    "Vehicle not found"
// @Failure      500  {object}  response.Error    "Internal server error"
// @Security     ApiKeyAuth
// @Router       /vehicle/{id} [delete]
func (h *HandlerVehicle) Delete(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][HandlerVehicle][Delete]", logId)
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	vehicleId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	if err = h.Service.Delete(vehicleId, userId); err != nil {
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

	res := response.Response(http.StatusOK, fmt.Sprintf("Vehicle with ID: '%s' deleted successfully", vehicleId), logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Vehicle with ID: '%s' deleted successfully", logPrefix, vehicleId))
	ctx.JSON(http.StatusOK, res)
}
