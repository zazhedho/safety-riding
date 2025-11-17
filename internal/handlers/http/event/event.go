package handlerevent

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"safety-riding/internal/dto"
	interfaceevent "safety-riding/internal/interfaces/event"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/messages"
	"safety-riding/pkg/response"
	"safety-riding/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type EventHandler struct {
	Service interfaceevent.ServiceEventInterface
}

func NewEventHandler(s interfaceevent.ServiceEventInterface) *EventHandler {
	return &EventHandler{
		Service: s,
	}
}

// AddEvent godoc
// @Summary Create a new event
// @Description Create a new safety riding event
// @Tags Events
// @Accept json
// @Produce json
// @Param event body dto.AddEvent true "Event payload"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /event [post]
func (h *EventHandler) AddEvent(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][AddEvent]", logId)

	var req dto.AddEvent
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.AddEvent(username, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AddEvent; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Add event successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

// GetEventById godoc
// @Summary Get event detail
// @Description Retrieve event information by ID
// @Tags Events
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /event/{id} [get]
func (h *EventHandler) GetEventById(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetEventById]", logId)

	eventId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetEventById(eventId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetEventById; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "event data not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get event successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v", logId, nil))
	ctx.JSON(http.StatusOK, res)
}

// UpdateEvent godoc
// @Summary Update an event
// @Description Update event information by ID
// @Tags Events
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Param event body dto.UpdateEvent true "Event payload"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /event/{id} [put]
func (h *EventHandler) UpdateEvent(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	role := utils.InterfaceString(authData["role"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][UpdateEvent]", logId)

	eventId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	var req dto.UpdateEvent
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.UpdateEvent(eventId, username, role, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdateEvent; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Update event successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// FetchEvent godoc
// @Summary List events
// @Description Retrieve paginated list of events with optional filters
// @Tags Events
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param sort query string false "Sort field"
// @Param order query string false "Sort order (asc/desc)"
// @Param school_id query string false "Filter by school ID"
// @Param district_id query string false "Filter by district ID"
// @Param city_id query string false "Filter by city ID"
// @Param province_id query string false "Filter by province ID"
// @Param event_type query string false "Filter by event type"
// @Param status query string false "Filter by status"
// @Success 200 {object} response.Success
// @Failure 404 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /events [get]
func (h *EventHandler) FetchEvent(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][FetchEvent]", logId)

	params, _ := filter.GetBaseParams(ctx, "event_date", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"school_id", "district_id", "city_id", "province_id", "event_type", "status"})

	events, totalData, err := h.Service.FetchEvent(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Fetch; Error: %+v", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.NotFound, logId, nil)
			res.Error = "List event not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}

		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, events)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(events)))
	ctx.JSON(http.StatusOK, res)
}

// DeleteEvent godoc
// @Summary Delete an event
// @Description Delete event by ID
// @Tags Events
// @Accept json
// @Produce json
// @Param id path string true "Event ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /event/{id} [delete]
func (h *EventHandler) DeleteEvent(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][DeleteEvent]", logId)

	id := ctx.Param("id")
	if id == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing event ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "Event ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if err := h.Service.DeleteEvent(id, username); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeleteEvent; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Delete event successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success;", logPrefix))
	ctx.JSON(http.StatusOK, res)
}

// AddEventPhotos godoc
// @Summary Upload event photos
// @Description Upload one or more event photos and metadata
// @Tags Events
// @Accept multipart/form-data
// @Produce json
// @Param id path string true "Event ID"
// @Param photos formData file true "Event photos"
// @Param captions formData string false "Photo captions (repeat per photo)"
// @Param photo_orders formData int false "Photo order (repeat per photo)"
// @Success 201 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /event/{id}/photos [post]
func (h *EventHandler) AddEventPhotos(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][AddEventPhotos]", logId)

	eventId := ctx.Param("id")
	if eventId == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing event ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "Event ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	// Parse multipart form
	form, err := ctx.MultipartForm()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; MultipartForm ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, "Failed to parse form data", logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	// Get files from form
	files := form.File["photos"]
	if len(files) == 0 {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; No photos uploaded", logPrefix))
		res := response.Response(http.StatusBadRequest, "At least one photo is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	// Get optional captions and photo orders from form data
	captions := form.Value["captions"]
	photoOrders := form.Value["photo_orders"]

	// Call service to upload photos to MinIO and save to database
	data, err := h.Service.AddEventPhotosFromFiles(ctx, eventId, username, files, captions, photoOrders)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.AddEventPhotosFromFiles; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Add event photos successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: uploaded %d photos;", logPrefix, len(files)))
	ctx.JSON(http.StatusCreated, res)
}

// DeleteEventPhoto godoc
// @Summary Delete event photo
// @Description Delete a single event photo by ID
// @Tags Events
// @Accept json
// @Produce json
// @Param photoId path string true "Photo ID"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Security ApiKeyAuth
// @Router /event/photo/{photoId} [delete]
func (h *EventHandler) DeleteEventPhoto(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	username := utils.InterfaceString(authData["username"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][DeleteEventPhoto]", logId)

	photoId := ctx.Param("photoId")
	if photoId == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing photo ID", logPrefix))
		res := response.Response(http.StatusBadRequest, "Photo ID is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if err := h.Service.DeleteEventPhoto(photoId, username); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeleteEventPhoto; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Delete event photo successfully", logId, nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success;", logPrefix))
	ctx.JSON(http.StatusOK, res)
}
