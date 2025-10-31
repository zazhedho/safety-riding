package handlerprovince

import (
	"fmt"
	"net/http"
	"safety-riding/internal/services/province"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
)

type ProvinceHandler struct {
	Service *serviceprovince.ProvinceService
}

func NewProvinceHandler(s *serviceprovince.ProvinceService) *ProvinceHandler {
	return &ProvinceHandler{
		Service: s,
	}
}

func (h *ProvinceHandler) GetProvince(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][ProvinceHandler][GetProvince]", logId)

	year := ctx.DefaultQuery("thn", utils.GetEnv("PROVINCE_YEAR", "2025").(string))
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Query Year: %s;", logPrefix, year))

	data, err := h.Service.GetProvince(year)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetProvince; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get province successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}
