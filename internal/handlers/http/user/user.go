package user

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"workshop-management/internal/dto"
	"workshop-management/internal/services/user"
	"workshop-management/pkg/filter"
	"workshop-management/pkg/logger"
	"workshop-management/pkg/messages"
	"workshop-management/pkg/response"
	"workshop-management/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HandlerUser struct {
	Service *user.ServiceUser
}

func NewUserHandler(s *user.ServiceUser) *HandlerUser {
	return &HandlerUser{Service: s}
}

// Register godoc
// @Summary Register a new user
// @Description Register a new user
// @Tags Users
// @Accept  json
// @Produce  json
// @Param user body dto.UserRegister true "User registration details"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /user/register [post]
func (h *HandlerUser) Register(ctx *gin.Context) {
	var req dto.UserRegister
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserHandler][Register]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))

		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.RegisterUser(req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.RegisterUser; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Error: email or phone already exists", logPrefix))
			res := response.Response(http.StatusBadRequest, messages.MsgExists, logId, nil)
			res.Error = response.Errors{Code: http.StatusBadRequest, Message: "email or phone already exists"}
			ctx.JSON(http.StatusBadRequest, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "User registered successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// Login godoc
// @Summary Login a user
// @Description Login a user
// @Tags Users
// @Accept  json
// @Produce  json
// @Param user body dto.Login true "User login details"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /user/login [post]
func (h *HandlerUser) Login(ctx *gin.Context) {
	var req dto.Login
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserController][Login]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))

		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	token, err := h.Service.LoginUser(req, logId.String())
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.LoginUser; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) || err.Error() == messages.ErrHashPassword {
			res := response.Response(http.StatusBadRequest, messages.InvalidCred, logId, nil)
			res.Error = response.Errors{Code: http.StatusBadRequest, Message: messages.MsgCredential}
			ctx.JSON(http.StatusBadRequest, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "success", logId, map[string]interface{}{"token": token})
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(token)))
	ctx.JSON(http.StatusOK, res)
}

// Logout godoc
// @Summary Logout a user
// @Description Logout a user
// @Tags Users
// @Accept  json
// @Produce  json
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user/logout [post]
func (h *HandlerUser) Logout(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserController][Logout]", logId)

	token, ok := ctx.Get("token")
	if !ok {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; token not found in context", logPrefix))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = "token not found"
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	if err := h.Service.LogoutUser(token.(string)); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.LogoutUser; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "User logged out successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: User logged out successfully", logPrefix))
	ctx.JSON(http.StatusOK, res)
}

// GetUserById godoc
// @Summary Get a user by ID
// @Description Get a user by ID
// @Tags Users
// @Accept  json
// @Produce  json
// @Param id path string true "User ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user/{id} [get]
func (h *HandlerUser) GetUserById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserHandler][GetUserByID]", logId)

	id, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetUserById(id)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetUserByID; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "user not found"}
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

// GetUserByAuth godoc
// @Summary Get a user by JWT token
// @Description Get a user by JWT token
// @Tags Users
// @Accept  json
// @Produce  json
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user [get]
func (h *HandlerUser) GetUserByAuth(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserHandler][GetUserByAuth]", logId)

	data, err := h.Service.GetUserByAuth(userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetUserByAuth; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "user not found"}
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

// GetAllUsers godoc
// @Summary      Get all users
// @Description  Get all users
// @Tags         Users
// @Accept       json
// @Produce  	 json
// @Param        page            query     int     false  "Page number for pagination"
// @Param        limit           query     int     false  "Number of items per page"
// @Param        order_by        query     string  false  "Field to sort by"
// @Param        order_direction query     string  false  "Sort direction (asc/desc)"
// @Param        search          query     string  false  "Search query to filter vehicles"
// @Success      200             {object}  response.Success
// @Failure      500             {object}  response.Error
// @Security     ApiKeyAuth
// @Router       /users [get]
func (h *HandlerUser) GetAllUsers(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserHandler][GetAllUsers]", logId)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"role"})

	users, totalData, err := h.Service.GetAllUsers(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetAllUsers; ERROR: %+v;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, users)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(users)))
	ctx.JSON(http.StatusOK, res)
}

// Update godoc
// @Summary Update a user
// @Description Update a user
// @Tags Users
// @Accept  json
// @Produce  json
// @Param id path string true "User ID"
// @Param user body dto.UserUpdate true "User update details"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user [put]
func (h *HandlerUser) Update(ctx *gin.Context) {
	var req dto.UserUpdate
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserHandler][Update]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))

		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.Update(userId, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Update; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "user not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "User updated successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// ChangePassword godoc
// @Summary Change a user's password
// @Description Change a user's password
// @Tags Users
// @Accept  json
// @Produce  json
// @Param id path string true "User ID"
// @Param user body dto.ChangePassword true "User change password details"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user/change/password [put]
func (h *HandlerUser) ChangePassword(ctx *gin.Context) {
	var req dto.ChangePassword
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserHandler][ChangePassword]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))

		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.ChangePassword(userId, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.ChangePassword; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "user not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		if err.Error() == messages.ErrHashPassword {
			res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
			res.Error = response.Errors{Code: http.StatusBadRequest, Message: "current password is incorrect"}
			ctx.JSON(http.StatusBadRequest, res)
			return
		}

		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "User password changed successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// Delete godoc
// @Summary Delete a user
// @Description Delete a user
// @Tags Users
// @Accept  json
// @Produce  json
// @Param id path string true "User ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /user [delete]
func (h *HandlerUser) Delete(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][UserHandler][Delete]", logId)
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	if err := h.Service.Delete(userId); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Delete; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "user not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "User deleted successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: User deleted successfully", logPrefix))
	ctx.JSON(http.StatusOK, res)
}
