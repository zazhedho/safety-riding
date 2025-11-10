package helpers

import (
	"fmt"
	"mime/multipart"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/imamhida1998/safety-riding/pkg/logger"
	"github.com/imamhida1998/safety-riding/pkg/response"
)

// ParsePhotoUploadForm parses multipart form data for photo uploads
// Eliminates duplicate photo upload form parsing in accident and event handlers
func ParsePhotoUploadForm(ctx *gin.Context, logPrefix string, logId interface{}) ([]*multipart.FileHeader, []string, []string, error) {
	// Parse multipart form
	form, err := ctx.MultipartForm()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; MultipartForm ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, "Failed to parse form data", logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return nil, nil, nil, err
	}

	// Get files from form
	files := form.File["photos"]
	if len(files) == 0 {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; No photos uploaded", logPrefix))
		res := response.Response(http.StatusBadRequest, "At least one photo is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return nil, nil, nil, fmt.Errorf("no photos uploaded")
	}

	// Get optional captions and photo orders
	captions := form.Value["captions"]
	photoOrders := form.Value["photo_orders"]

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Parsed %d photos with %d captions", logPrefix, len(files), len(captions)))

	return files, captions, photoOrders, nil
}
