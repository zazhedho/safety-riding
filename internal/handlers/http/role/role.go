package handlerole

import (
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	servicerole "safety-riding/internal/services/role"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
)

type RoleHandler struct {
	Service *servicerole.RoleService
}

func NewRoleHandler(s *servicerole.RoleService) *RoleHandler {
	return &RoleHandler{Service: s}
}

// Create creates a new role
func (h *RoleHandler) Create(ctx *gin.Context) {
	var req dto.RoleCreate
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][RoleHandler][Create]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.Create(req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Create; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, err.Error(), logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Role created successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// GetByID retrieves a role by ID with full details
func (h *RoleHandler) GetByID(ctx *gin.Context) {
	id := ctx.Param("id")
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][RoleHandler][GetByID]", logId)

	data, err := h.Service.GetByIDWithDetails(id)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetByIDWithDetails; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusNotFound, "Role not found", logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusOK, "Get role successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// GetAll retrieves all roles with pagination
func (h *RoleHandler) GetAll(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][RoleHandler][GetAll]", logId)

	params, err := filter.GetBaseParams(ctx, "name", "asc", 10)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetBaseParams; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, total, err := h.Service.GetAll(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetAll; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(total), params.Page, params.Limit, logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// Update updates a role
func (h *RoleHandler) Update(ctx *gin.Context) {
	id := ctx.Param("id")
	var req dto.RoleUpdate
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][RoleHandler][Update]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.Update(id, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Update; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, err.Error(), logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Role updated successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// Delete deletes a role
func (h *RoleHandler) Delete(ctx *gin.Context) {
	id := ctx.Param("id")
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][RoleHandler][Delete]", logId)

	if err := h.Service.Delete(id); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Delete; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, err.Error(), logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Role deleted successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: Role deleted", logPrefix))
	ctx.JSON(http.StatusOK, res)
}

// AssignPermissions assigns permissions to a role
func (h *RoleHandler) AssignPermissions(ctx *gin.Context) {
	id := ctx.Param("id")
	var req dto.AssignPermissions
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][RoleHandler][AssignPermissions]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	if err := h.Service.AssignPermissions(id, req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AssignPermissions; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, err.Error(), logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Permissions assigned successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Permissions assigned", logPrefix))
	ctx.JSON(http.StatusOK, res)
}

// AssignMenus assigns menus to a role
func (h *RoleHandler) AssignMenus(ctx *gin.Context) {
	id := ctx.Param("id")
	var req dto.AssignMenus
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][RoleHandler][AssignMenus]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	if err := h.Service.AssignMenus(id, req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AssignMenus; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, err.Error(), logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Menus assigned successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Menus assigned", logPrefix))
	ctx.JSON(http.StatusOK, res)
}
