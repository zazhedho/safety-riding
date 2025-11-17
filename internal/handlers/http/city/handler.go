package handlercity

import (
	"fmt"
	"net/http"
	interfacecity "safety-riding/internal/interfaces/city"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
)

type CityHandler struct {
	Service interfacecity.ServiceCityInterface
}

func NewKabupatenHandler(s interfacecity.ServiceCityInterface) *CityHandler {
	return &CityHandler{
		Service: s,
	}
}

// GetCity godoc
// @Summary Get cities
// @Description Retrieve list of cities filtered by province
// @Tags Cities
// @Accept json
// @Produce json
// @Param thn query string false "Reference year (default from env)"
// @Param lvl query string false "Level code (default 11)"
// @Param pro query string true "Province code"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /city [get]
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
