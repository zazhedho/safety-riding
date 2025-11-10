package handlermenu

import (
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	interfacemenu "safety-riding/internal/interfaces/menu"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
)

type MenuHandler struct {
	Service interfacemenu.ServiceMenuInterface
}

func NewMenuHandler(s interfacemenu.ServiceMenuInterface) *MenuHandler {
	return &MenuHandler{Service: s}
}

// Create creates a new menu item
func (h *MenuHandler) Create(ctx *gin.Context) {
	var req dto.MenuItemCreate
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MenuHandler][Create]", logId)

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

	res := response.Response(http.StatusCreated, "Menu item created successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// GetByID retrieves a menu item by ID
func (h *MenuHandler) GetByID(ctx *gin.Context) {
	id := ctx.Param("id")
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MenuHandler][GetByID]", logId)

	data, err := h.Service.GetByID(id)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetByID; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusNotFound, "Menu item not found", logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusOK, "Get menu item successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// GetAll retrieves all menu items with pagination
func (h *MenuHandler) GetAll(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MenuHandler][GetAll]", logId)

	params, err := filter.GetBaseParams(ctx, "order_index", "asc", 100)
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

// GetActiveMenus retrieves all active menu items
func (h *MenuHandler) GetActiveMenus(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MenuHandler][GetActiveMenus]", logId)

	data, err := h.Service.GetActiveMenus()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetActiveMenus; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get active menus successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// GetUserMenus retrieves all menus for the current user
func (h *MenuHandler) GetUserMenus(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MenuHandler][GetUserMenus]", logId)

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request received", logPrefix))

	// Get user ID from context (set by auth middleware)
	userId, exists := ctx.Get("userId")
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; userId from context: %v, exists: %v", logPrefix, userId, exists))

	if !exists {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; User ID not found in context", logPrefix))

		// Try to get from auth data as fallback
		authData := utils.GetAuthData(ctx)
		logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; AuthData: %+v", logPrefix, authData))

		if authData != nil {
			if userIdFromAuth := utils.InterfaceString(authData["user_id"]); userIdFromAuth != "" {
				logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Found userId from AuthData: %s", logPrefix, userIdFromAuth))
				userId = userIdFromAuth
			} else {
				res := response.Response(http.StatusUnauthorized, "Unauthorized", logId, nil)
				ctx.JSON(http.StatusUnauthorized, res)
				return
			}
		} else {
			res := response.Response(http.StatusUnauthorized, "Unauthorized", logId, nil)
			ctx.JSON(http.StatusUnauthorized, res)
			return
		}
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Calling Service.GetUserMenus with userId: %s", logPrefix, userId))

	data, err := h.Service.GetUserMenus(userId.(string))
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetUserMenus; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get user menus successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// Update updates a menu item
func (h *MenuHandler) Update(ctx *gin.Context) {
	id := ctx.Param("id")
	var req dto.MenuItemUpdate
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MenuHandler][Update]", logId)

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

	res := response.Response(http.StatusOK, "Menu item updated successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// Delete deletes a menu item
func (h *MenuHandler) Delete(ctx *gin.Context) {
	id := ctx.Param("id")
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][MenuHandler][Delete]", logId)

	if err := h.Service.Delete(id); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Delete; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, err.Error(), logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Menu item deleted successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: Menu item deleted", logPrefix))
	ctx.JSON(http.StatusOK, res)
}
