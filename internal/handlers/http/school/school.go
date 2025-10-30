package handlerschool

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	"safety-riding/internal/services/school"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SchoolHandler struct {
	Service *serviceschool.SchoolService
}

func NewSchoolHandler(s *serviceschool.SchoolService) *SchoolHandler {
	return &SchoolHandler{
		Service: s,
	}
}

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

func (h *SchoolHandler) FetchSchool(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][SchoolHandler][FetchSchool]", logId)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"district_id", "city_id", "province_id"})

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
