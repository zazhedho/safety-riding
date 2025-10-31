package handlercity

import (
	"fmt"
	"net/http"
	"safety-riding/internal/services/city"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
)

type CityHandler struct {
	Service *servicecity.CityService
}

func NewKabupatenHandler(s *servicecity.CityService) *CityHandler {
	return &CityHandler{
		Service: s,
	}
}

func (h *CityHandler) GetCity(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][CityHandler][GetCity]", logId)

	year := ctx.DefaultQuery("thn", utils.GetEnv("PROVINCE_YEAR", "2025").(string))
	lvl := ctx.DefaultQuery("lvl", "11")
	pro := ctx.Query("pro")

	if pro == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing required parameter: pro", logPrefix))
		res := response.Response(http.StatusBadRequest, "Parameter 'pro' is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Query params - year: %s, lvl: %s, pro: %s;", logPrefix, year, lvl, pro))

	data, err := h.Service.GetCity(year, lvl, pro)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetCity; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get city successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}
