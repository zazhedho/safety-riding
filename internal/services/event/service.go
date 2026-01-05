package serviceevent

import (
	"context"
	"fmt"
	"mime/multipart"
	"safety-riding/internal/domain/event"
	"safety-riding/internal/dto"
	interfaceevent "safety-riding/internal/interfaces/event"
	interfaceschool "safety-riding/internal/interfaces/school"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/storage"
	"safety-riding/utils"
	"strconv"
	"strings"
	"time"
)

type EventService struct {
	EventRepo       interfaceevent.RepoEventInterface
	SchoolRepo      interfaceschool.RepoSchoolInterface
	StorageProvider storage.StorageProvider
}

func NewEventService(eventRepo interfaceevent.RepoEventInterface, schoolRepo interfaceschool.RepoSchoolInterface, storageProvider storage.StorageProvider) *EventService {
	return &EventService{
		EventRepo:       eventRepo,
		SchoolRepo:      schoolRepo,
		StorageProvider: storageProvider,
	}
}

func (s *EventService) AddEvent(username string, req dto.AddEvent) (domainevent.Event, error) {
	eventId := utils.CreateUUID()
	phone := utils.NormalizePhoneTo62(req.InstructorPhone)

	// Validate non-negative values
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"target_attendees":            req.TargetAttendees,
		"attendees_count":             req.AttendeesCount,
		"visiting_service_unit_entry": req.VisitingServiceUnitEntry,
		"visiting_service_profit":     req.VisitingServiceProfit,
	}); err != nil {
		return domainevent.Event{}, err
	}

	if err := utils.ValidateOnTheSpotSales(req.OnTheSpotSales); err != nil {
		return domainevent.Event{}, err
	}

	// Validate: if status is "completed", attendees_count must be filled (> 0)
	if strings.EqualFold(req.Status, utils.StsCompleted) && req.AttendeesCount == 0 {
		return domainevent.Event{}, fmt.Errorf("attendees_count must be greater than 0 when event status is 'completed'")
	}

	// Handle SchoolId and PublicId (convert empty string to nil for UUID fields)
	var schoolId *string
	var publicId *string
	if req.SchoolId != "" {
		schoolId = &req.SchoolId
	}
	if req.PublicId != "" {
		publicId = &req.PublicId
	}

	data := domainevent.Event{
		ID:                       eventId,
		SchoolId:                 schoolId,
		PublicId:                 publicId,
		Title:                    utils.TitleCase(req.Title),
		Description:              req.Description,
		EventDate:                req.EventDate,
		StartTime:                req.StartTime,
		EndTime:                  req.EndTime,
		Location:                 req.Location,
		DistrictId:               req.DistrictId,
		CityId:                   req.CityId,
		ProvinceId:               req.ProvinceId,
		EventType:                req.EventType,
		TargetAudience:           req.TargetAudience,
		TargetAttendees:          req.TargetAttendees,
		AttendeesCount:           req.AttendeesCount,
		VisitingServiceUnitEntry: req.VisitingServiceUnitEntry,
		VisitingServiceProfit:    req.VisitingServiceProfit,
		InstructorName:           utils.TitleCase(req.InstructorName),
		InstructorPhone:          phone,
		Status:                   strings.ToLower(req.Status),
		Notes:                    req.Notes,
		AppsDownloaded:           req.AppsDownloaded,
		AppsName:                 req.AppsName,
		CreatedAt:                time.Now(),
		CreatedBy:                username,
	}

	// Add photos if provided
	if len(req.Photos) > 0 {
		photos := make([]domainevent.EventPhoto, 0, len(req.Photos))
		for _, p := range req.Photos {
			photos = append(photos, domainevent.EventPhoto{
				ID:         utils.CreateUUID(),
				EventId:    eventId,
				PhotoUrl:   p.PhotoUrl,
				Caption:    p.Caption,
				PhotoOrder: p.PhotoOrder,
				CreatedAt:  time.Now(),
				CreatedBy:  username,
			})
		}
		data.Photos = photos
	}

	if err := s.EventRepo.Create(data); err != nil {
		return domainevent.Event{}, err
	}

	// Persist on the spot sales entries
	if len(req.OnTheSpotSales) > 0 {
		sales := utils.BuildOnTheSpotSales(eventId, username, req.OnTheSpotSales)
		if err := s.EventRepo.AddOnTheSpotSales(sales); err != nil {
			return domainevent.Event{}, err
		}
		data.OnTheSpotSales = sales
	}

	// Update school data if schoolId is provided
	if req.SchoolId != "" && strings.EqualFold(req.Status, utils.StsCompleted) {
		school, err := s.SchoolRepo.GetByID(req.SchoolId)
		if err == nil {
			school.IsEducated = true
			school.VisitCount++

			// Use event_date + end_time as lastVisitAt
			eventDateTime, err := utils.ParseEventDateTime(req.EventDate, req.EndTime)
			if err != nil {
				now := time.Now()
				school.LastVisitAt = &now
			} else {
				school.LastVisitAt = &eventDateTime
			}

			school.UpdatedBy = username
			if err = s.SchoolRepo.Update(school); err != nil {
				return domainevent.Event{}, err
			}
		}
	}

	return data, nil
}

func (s *EventService) GetEventById(id string) (domainevent.Event, error) {
	return s.EventRepo.GetByID(id)
}

func (s *EventService) UpdateEvent(id, username, role string, req dto.UpdateEvent) (domainevent.Event, error) {
	// Validate non-negative values
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"target_attendees":            req.TargetAttendees,
		"attendees_count":             req.AttendeesCount,
		"visiting_service_unit_entry": req.VisitingServiceUnitEntry,
		"visiting_service_profit":     req.VisitingServiceProfit,
	}); err != nil {
		return domainevent.Event{}, err
	}

	if req.OnTheSpotSales != nil {
		if err := utils.ValidateOnTheSpotSales(req.OnTheSpotSales); err != nil {
			return domainevent.Event{}, err
		}
	}

	// Get existing event
	event, err := s.EventRepo.GetByID(id)
	if err != nil {
		return domainevent.Event{}, err
	}

	// Prevent update if event status is final (Completed or Cancelled)
	// Exception: admin role can bypass this validation
	isFinalized := strings.EqualFold(event.Status, utils.StsCompleted) || strings.EqualFold(event.Status, utils.StsCancelled)
	isAdmin := strings.EqualFold(role, utils.RoleAdmin)

	if isFinalized && !isAdmin {
		return domainevent.Event{}, fmt.Errorf("cannot update event with status '%s'. Event is already finalized", event.Status)
	}

	// Validate: if changing status to "completed", attendees_count must be filled (> 0)
	if req.Status != "" && strings.EqualFold(req.Status, utils.StsCompleted) {
		attendeesCount := event.AttendeesCount
		if req.AttendeesCount != 0 {
			attendeesCount = req.AttendeesCount
		}
		if attendeesCount == 0 {
			return domainevent.Event{}, fmt.Errorf("attendees_count must be greater than 0 when changing event status to 'completed'")
		}
	}

	// Update fields if provided
	if req.SchoolId != "" {
		event.SchoolId = &req.SchoolId
	}
	if req.PublicId != "" {
		event.PublicId = &req.PublicId
	}
	if req.Title != "" {
		event.Title = req.Title
	}
	if req.Description != "" {
		event.Description = req.Description
	}
	if req.EventDate != "" {
		event.EventDate = req.EventDate
	}
	if req.StartTime != "" {
		event.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		event.EndTime = req.EndTime
	}
	if req.Location != "" {
		event.Location = req.Location
	}
	if req.DistrictId != "" {
		event.DistrictId = req.DistrictId
	}
	if req.CityId != "" {
		event.CityId = req.CityId
	}
	if req.ProvinceId != "" {
		event.ProvinceId = req.ProvinceId
	}
	if req.EventType != "" {
		event.EventType = req.EventType
	}
	if req.TargetAudience != "" {
		event.TargetAudience = req.TargetAudience
	}
	if req.TargetAttendees != 0 {
		event.TargetAttendees = req.TargetAttendees
	}
	if req.AttendeesCount != 0 {
		event.AttendeesCount = req.AttendeesCount
	}
	if req.VisitingServiceUnitEntry != 0 {
		event.VisitingServiceUnitEntry = req.VisitingServiceUnitEntry
	}
	if req.VisitingServiceProfit != 0 {
		event.VisitingServiceProfit = req.VisitingServiceProfit
	}
	if req.InstructorName != "" {
		event.InstructorName = req.InstructorName
	}
	if req.InstructorPhone != "" {
		phone := utils.NormalizePhoneTo62(req.InstructorPhone)
		event.InstructorPhone = phone
	}
	if req.Status != "" {
		event.Status = req.Status
	}
	if req.Notes != "" {
		event.Notes = req.Notes
	}
	if req.AppsDownloaded != 0 {
		event.AppsDownloaded = req.AppsDownloaded
	}
	if req.AppsName != "" {
		event.AppsName = req.AppsName
	}

	event.UpdatedAt = time.Now()
	event.UpdatedBy = username

	if err := s.EventRepo.UpdateById(id, event); err != nil {
		return domainevent.Event{}, err
	}

	// Replace on the spot sales entries when provided
	if req.OnTheSpotSales != nil {
		if err := s.EventRepo.DeleteOnTheSpotSalesByEventID(id); err != nil {
			return domainevent.Event{}, err
		}

		sales := utils.BuildOnTheSpotSales(id, username, req.OnTheSpotSales)
		if err := s.EventRepo.AddOnTheSpotSales(sales); err != nil {
			return domainevent.Event{}, err
		}
		event.OnTheSpotSales = sales
	}

	// Update school data if schoolId is provided
	if req.SchoolId != "" && strings.EqualFold(req.Status, utils.StsCompleted) {
		school, err := s.SchoolRepo.GetByID(req.SchoolId)
		if err == nil {
			school.IsEducated = true
			school.VisitCount++

			eventDate := event.EventDate
			endTime := event.EndTime
			eventDateTime, err := utils.ParseEventDateTime(eventDate, endTime)
			if err != nil {
				// Fallback to current time if parsing fails
				now := time.Now()
				school.LastVisitAt = &now
			} else {
				school.LastVisitAt = &eventDateTime
			}

			school.UpdatedBy = username
			if err = s.SchoolRepo.Update(school); err != nil {
				return domainevent.Event{}, err
			}
		}
	}

	return event, nil
}

func (s *EventService) FetchEvent(params filter.BaseParams) ([]domainevent.Event, int64, error) {
	return s.EventRepo.Fetch(params)
}

func (s *EventService) DeleteEvent(id, username string) error {
	// Check if event exists
	event, err := s.EventRepo.GetByID(id)
	if err != nil {
		return err
	}

	if strings.EqualFold(event.Status, utils.StsCompleted) || strings.EqualFold(event.Status, utils.StsCancelled) {
		return fmt.Errorf("cannot delete event with status '%s'. Event is already finalized", event.Status)
	}

	// Update deleted fields
	event.DeletedBy = username

	// Delete associated photos first
	if err := s.EventRepo.DeletePhotosByEventID(id); err != nil {
		return err
	}

	// Delete on the spot sales entries
	if err := s.EventRepo.DeleteOnTheSpotSalesByEventID(id); err != nil {
		return err
	}

	// Soft delete event
	if err := s.EventRepo.Delete(id); err != nil {
		return err
	}

	return nil
}

// Photo methods
func (s *EventService) AddEventPhotos(eventId, username string, photos []dto.AddEventPhoto) ([]domainevent.EventPhoto, error) {
	// Verify event exists
	eventData, err := s.EventRepo.GetByID(eventId)
	if err != nil {
		return nil, err
	}

	maxEventPhotos := utils.GetEnv("MAX_EVENT_PHOTOS", 5).(int)
	if err := utils.ValidatePhotoLimit(len(eventData.Photos), len(photos), maxEventPhotos); err != nil {
		return nil, err
	}

	eventPhotos := make([]domainevent.EventPhoto, 0, len(photos))
	for _, p := range photos {
		eventPhotos = append(eventPhotos, domainevent.EventPhoto{
			ID:         utils.CreateUUID(),
			EventId:    eventId,
			PhotoUrl:   p.PhotoUrl,
			Caption:    p.Caption,
			PhotoOrder: p.PhotoOrder,
			CreatedAt:  time.Now(),
			CreatedBy:  username,
		})
	}

	if err := s.EventRepo.AddPhotos(eventPhotos); err != nil {
		return nil, err
	}

	return eventPhotos, nil
}

func (s *EventService) DeleteEventPhoto(photoId, username string) error {
	eventPhoto, err := s.EventRepo.GetPhotoByID(photoId)
	if err != nil {
		return err
	}

	if err = s.EventRepo.DeletePhoto(photoId); err == nil {
		_ = s.StorageProvider.DeleteFile(context.Background(), eventPhoto.PhotoUrl)
	}

	return err
}

// AddEventPhotosFromFiles uploads photos to storage and saves to database
func (s *EventService) AddEventPhotosFromFiles(ctx context.Context, eventId, username string, files []*multipart.FileHeader, captions []string, photoOrders []string) ([]domainevent.EventPhoto, error) {
	// Verify event exists
	eventData, err := s.EventRepo.GetByID(eventId)
	if err != nil {
		return nil, err
	}

	maxEventPhotos := utils.GetEnv("MAX_EVENT_PHOTOS", 5).(int)
	if err := utils.ValidatePhotoLimit(len(eventData.Photos), len(files), maxEventPhotos); err != nil {
		return nil, err
	}

	eventPhotos := make([]domainevent.EventPhoto, 0, len(files))

	var photoURL string
	for i, fileHeader := range files {
		if err := utils.ValidatePhotoFileSize(fileHeader); err != nil {
			return nil, err
		}

		// Open file
		file, err := fileHeader.Open()
		if err != nil {
			return nil, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
		}
		defer file.Close()

		// Upload to storage provider (MinIO or R2)
		photoURL, err = s.StorageProvider.UploadFile(ctx, file, fileHeader, "event-photos")
		if err != nil {
			return nil, fmt.Errorf("failed to upload file %s to storage: %w", fileHeader.Filename, err)
		}

		// Get caption if provided
		caption := ""
		if i < len(captions) {
			caption = captions[i]
		}

		// Get photo order if provided
		photoOrder := 0
		if i < len(photoOrders) {
			if order, err := strconv.Atoi(photoOrders[i]); err == nil {
				photoOrder = order
			}
		}

		// Create photo record
		eventPhoto := domainevent.EventPhoto{
			ID:         utils.CreateUUID(),
			EventId:    eventId,
			PhotoUrl:   photoURL,
			Caption:    caption,
			PhotoOrder: photoOrder,
			CreatedAt:  time.Now(),
			CreatedBy:  username,
		}

		eventPhotos = append(eventPhotos, eventPhoto)
	}

	// Save photos to database
	if err := s.EventRepo.AddPhotos(eventPhotos); err != nil {
		_ = s.StorageProvider.DeleteFile(ctx, photoURL)
		return nil, err
	}

	return eventPhotos, nil
}

var _ interfaceevent.ServiceEventInterface = (*EventService)(nil)

func (s *EventService) GetCompletedEventsForMap(since time.Time) ([]dto.EventMapData, error) {
	events, err := s.EventRepo.FetchCompletedWithCoords(since)
	if err != nil {
		return nil, err
	}

	result := make([]dto.EventMapData, 0, len(events))
	for _, e := range events {
		var lat, lng float64
		var venueName, venueType string

		if e.School != nil && (e.School.Latitude != 0 || e.School.Longitude != 0) {
			lat, lng = e.School.Latitude, e.School.Longitude
			venueName = e.School.Name
			venueType = "school"
		} else if e.Public != nil && (e.Public.Latitude != 0 || e.Public.Longitude != 0) {
			lat, lng = e.Public.Latitude, e.Public.Longitude
			venueName = e.Public.Name
			venueType = "public"
		}

		if lat == 0 && lng == 0 {
			continue
		}

		result = append(result, dto.EventMapData{
			ID:             e.ID,
			Title:          e.Title,
			EventDate:      e.EventDate,
			EventType:      e.EventType,
			Location:       e.Location,
			AttendeesCount: e.AttendeesCount,
			Status:         e.Status,
			Latitude:       lat,
			Longitude:      lng,
			VenueName:      venueName,
			VenueType:      venueType,
		})
	}

	return result, nil
}
