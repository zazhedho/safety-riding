package handlerappconfig

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	interfaceappconfig "safety-riding/internal/interfaces/appconfig"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AppConfigHandler struct {
	Service interfaceappconfig.ServiceAppConfigInterface
}

func NewAppConfigHandler(s interfaceappconfig.ServiceAppConfigInterface) *AppConfigHandler {
	return &AppConfigHandler{Service: s}
}

func (h *AppConfigHandler) GetAll(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][AppConfigHandler][GetAll]", logID)

	params, _ := filter.GetBaseParams(ctx, "category", "asc", 50)
	params.Filters = filter.WhitelistStringFilter(params.Filters, []string{"category"})

	data, totalData, err := h.Service.GetAll(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetAll; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logID, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *AppConfigHandler) Update(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][AppConfigHandler][Update]", logID)

	configID, err := utils.ValidateUUID(ctx, logID)
	if err != nil {
		return
	}

	var req dto.UpdateAppConfig
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logID, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.Update(configID, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.Update; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logID, nil)
			res.Error = "config data not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Update configuration successfully", logID, data)
	ctx.JSON(http.StatusOK, res)
}
