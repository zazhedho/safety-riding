package handlerschool

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	interfaceschool "safety-riding/internal/interfaces/school"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SchoolHandler struct {
	Service interfaceschool.ServiceSchoolInterface
}

func NewSchoolHandler(s interfaceschool.ServiceSchoolInterface) *SchoolHandler {
	return &SchoolHandler{
		Service: s,
	}
}

// AddSchool godoc
// @Summary Create a new school
// @Description Create a new school record
// @Tags Schools
// @Accept json
// @Produce json
// @Param school body dto.AddSchool true "School payload"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /school [post]
func (h *SchoolHandler) AddSchool(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SchoolHandler][AddSchool]", logId)

	var req dto.AddSchool
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.AddSchool(username, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AddSchool; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Add school successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// GetSchoolById godoc
// @Summary Get school detail
// @Description Retrieve school information by ID
// @Tags Schools
// @Accept json
// @Produce json
// @Param id path string true "School ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /school/{id} [get]
func (h *SchoolHandler) GetSchoolById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SchoolHandler][GetSchoolById]", logId)

	schoolId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetSchoolById(schoolId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetSchoolById; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "school data not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get school successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v", logId, nil))
	ctx.JSON(http.StatusOK, res)
}

// UpdateSchool godoc
// @Summary Update a school
// @Description Update school information by ID
// @Tags Schools
// @Accept json
// @Produce json
// @Param id path string true "School ID"
// @Param school body dto.UpdateSchool true "School payload"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /school/{id} [put]
func (h *SchoolHandler) UpdateSchool(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SchoolHandler][UpdateSchool]", logId)

	schoolId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdateSchool
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.UpdateSchool(schoolId, username, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdateSchool; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Update school successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// FetchSchool godoc
// @Summary List schools
// @Description Retrieve paginated schools with optional filters
// @Tags Schools
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param sort query string false "Sort field"
// @Param order query string false "Sort order (asc/desc)"
// @Param district_id query string false "Filter by district ID"
// @Param city_id query string false "Filter by city ID"
// @Param province_id query string false "Filter by province ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /schools [get]
func (h *SchoolHandler) FetchSchool(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SchoolHandler][FetchSchool]", logId)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistStringFilter(params.Filters, []string{"district_id", "city_id", "province_id"})

	schools, totalData, err := h.Service.FetchSchool(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "List school not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, schools)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(schools)))
	ctx.JSON(http.StatusOK, res)

}

// DeleteSchool godoc
// @Summary Delete a school
// @Description Delete school by ID
// @Tags Schools
// @Accept json
// @Produce json
// @Param id path string true "School ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /school/{id} [delete]
func (h *SchoolHandler) DeleteSchool(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SchoolHandler][DeleteSchool]", logId)

	id := ctx.Param("id")
	if id == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing school ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "School ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if err := h.Service.DeleteSchool(id, username); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeleteSchool; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Delete school successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success;", logPrefix))
	ctx.JSON(http.StatusOK, res)
}

// GetEducationStats godoc
// @Summary Get school education statistics
// @Description Retrieve aggregated school education statistics with optional filters
// @Tags Schools
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param district_id query string false "Filter by district ID"
// @Param city_id query string false "Filter by city ID"
// @Param province_id query string false "Filter by province ID"
// @Param is_educated query string false "Filter by education completion flag"
// @Param month query string false "Filter by month"
// @Param year query string false "Filter by year"
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /schools/education-stats [get]
func (h *SchoolHandler) GetEducationStats(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SchoolHandler][GetEducationStats]", logId)

	params, _ := filter.GetBaseParams(ctx, "name", "asc", 10)
	params.Filters = filter.WhitelistStringFilter(params.Filters, []string{"district_id", "city_id", "province_id", "is_educated", "month", "year"})

	stats, err := h.Service.GetEducationStats(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetEducationStats; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get school education statistics successfully", logId, stats)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: total schools=%d, total students educated=%d", logId, stats.TotalSchools, stats.TotalAllStudents))
	ctx.JSON(http.StatusOK, res)
}

// GetEducationPriority godoc
// @Summary Get education priority matrix
// @Description Retrieve education priority matrix combining market share, school, and accident data
// @Tags Schools
// @Accept json
// @Produce json
// @Param district_id query string false "Filter by district ID"
// @Param city_id query string false "Filter by city ID"
// @Param province_id query string false "Filter by province ID"
// @Param month query string false "Filter by month"
// @Param year query string false "Filter by year"
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /schools/education-priority [get]
func (h *SchoolHandler) GetEducationPriority(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SchoolHandler][GetEducationPriority]", logId)

	params, _ := filter.GetBaseParams(ctx, "market_share", "asc", 100)
	params.Filters = filter.WhitelistStringFilter(params.Filters, []string{"district_id", "city_id", "province_id", "month", "year"})

	priority, err := h.Service.GetEducationPriority(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetEducationPriority; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get education priority matrix successfully", logId, priority)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: total items=%d, critical=%d, high=%d", logId, priority.TotalItems, priority.CriticalCount, priority.HighPriorityCount))
	ctx.JSON(http.StatusOK, res)
}
