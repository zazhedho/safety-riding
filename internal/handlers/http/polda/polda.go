package handlerpolda

import (
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	interfacepolda "safety-riding/internal/interfaces/polda"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type PoldaAccidentHandler struct {
	service   interfacepolda.ServicePoldaInterface
	validator *validator.Validate
}

func NewPoldaAccidentHandler(service interfacepolda.ServicePoldaInterface) *PoldaAccidentHandler {
	return &PoldaAccidentHandler{
		service:   service,
		validator: validator.New(),
	}
}

// Create godoc
// @Summary Create POLDA accident data
// @Description Create new POLDA accident statistics
// @Tags POLDA Accidents
// @Accept json
// @Produce json
// @Param polda body dto.CreatePoldaAccidentRequest true "POLDA accident data"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /api/polda-accident [post]
func (h *PoldaAccidentHandler) Create(c *gin.Context) {
	logId := utils.GenerateLogId(c)
	logPrefix := fmt.Sprintf("[%s][PoldaAccidentHandler][Create]", logId)

	var req dto.CreatePoldaAccidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		c.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	if err := h.validator.Struct(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Validation ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = err.Error()
		c.JSON(http.StatusBadRequest, res)
		return
	}

	userID := c.GetString("user_id")
	if err := h.service.Create(&req, userID); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Create; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		c.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Create POLDA accident successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success", logPrefix))
	c.JSON(http.StatusCreated, res)
}

// GetAll godoc
// @Summary Get all POLDA accident data
// @Description Get list of POLDA accident statistics with pagination and filtering
// @Tags POLDA Accidents
// @Accept json
// @Produce json
// @Param search query string false "Search by police unit"
// @Param filters query string false "JSON filters object (e.g., {\"period\":\"2024-01\"})"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param order_by query string false "Order by field" default("created_at")
// @Param order_direction query string false "Order direction (asc/desc)" default("desc")
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /api/polda-accidents [get]
func (h *PoldaAccidentHandler) GetAll(c *gin.Context) {
	logId := utils.GenerateLogId(c)
	logPrefix := fmt.Sprintf("[%s][PoldaAccidentHandler][GetAll]", logId)

	params, _ := filter.GetBaseParams(c, "created_at", "desc", 10)
	params.Filters = filter.WhitelistStringFilter(params.Filters, []string{"period", "police_unit"})

	data, total, err := h.service.GetAll(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetAll; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		c.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(total), params.Page, params.Limit, logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %d records", logPrefix, len(data)))
	c.JSON(http.StatusOK, res)
}

// GetByID godoc
// @Summary Get POLDA accident by ID
// @Description Get specific POLDA accident data by ID
// @Tags POLDA Accidents
// @Accept json
// @Produce json
// @Param id path string true "POLDA accident ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Security ApiKeyAuth
// @Router /api/polda-accident/{id} [get]
func (h *PoldaAccidentHandler) GetByID(c *gin.Context) {
	logId := utils.GenerateLogId(c)
	logPrefix := fmt.Sprintf("[%s][PoldaAccidentHandler][GetByID]", logId)
	id := c.Param("id")

	data, err := h.service.GetByID(id)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetByID; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
		res.Error = "POLDA accident data not found"
		c.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusOK, "Get POLDA accident successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success", logPrefix))
	c.JSON(http.StatusOK, res)
}

// Update godoc
// @Summary Update POLDA accident data
// @Description Update existing POLDA accident statistics
// @Tags POLDA Accidents
// @Accept json
// @Produce json
// @Param id path string true "POLDA accident ID"
// @Param polda body dto.UpdatePoldaAccidentRequest true "Updated data"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /api/polda-accident/{id} [put]
func (h *PoldaAccidentHandler) Update(c *gin.Context) {
	logId := utils.GenerateLogId(c)
	id := c.Param("id")
	var req dto.UpdatePoldaAccidentRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		c.JSON(http.StatusBadRequest, res)
		return
	}

	if err := h.validator.Struct(&req); err != nil {
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		c.JSON(http.StatusBadRequest, res)
		return
	}

	userID := c.GetString("user_id")
	if err := h.service.Update(id, &req, userID); err != nil {
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		c.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Data updated successfully", logId, nil)
	c.JSON(http.StatusOK, res)
}

// Delete godoc
// @Summary Delete POLDA accident data
// @Description Delete POLDA accident statistics
// @Tags POLDA Accidents
// @Accept json
// @Produce json
// @Param id path string true "POLDA accident ID"
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /api/polda-accident/{id} [delete]
func (h *PoldaAccidentHandler) Delete(c *gin.Context) {
	logId := utils.GenerateLogId(c)
	id := c.Param("id")

	if err := h.service.Delete(id); err != nil {
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		c.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Data deleted successfully", logId, nil)
	c.JSON(http.StatusOK, res)
}
