package handlerdistrict

import (
	"fmt"
	"net/http"
	"safety-riding/internal/services/district"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
)

type DistrictHandler struct {
	Service *servicedistrict.DistrictService
}

func NewDistrictHandler(s *servicedistrict.DistrictService) *DistrictHandler {
	return &DistrictHandler{
		Service: s,
	}
}

func (h *DistrictHandler) GetDistrict(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][DistrictHandler][GetDistrict]", logId)

	year := ctx.DefaultQuery("thn", utils.GetEnv("PROVINCE_YEAR", "2025").(string))
	lvl := ctx.DefaultQuery("lvl", "12")
	pro := ctx.Query("pro")
	kab := ctx.Query("kab")

	if pro == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing required parameter: pro", logPrefix))
		res := response.Response(http.StatusBadRequest, "Parameter 'pro' is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if kab == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing required parameter: kab", logPrefix))
		res := response.Response(http.StatusBadRequest, "Parameter 'kab' is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Query params - year: %s, lvl: %s, pro: %s, kab: %s;", logPrefix, year, lvl, pro, kab))

	data, err := h.Service.GetDistrict(year, lvl, pro, kab)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetDistrict; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get district successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}
