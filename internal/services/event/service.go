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
	minioclient "safety-riding/pkg/minio"
	"safety-riding/utils"
	"strconv"
	"strings"
	"time"
)

type EventService struct {
	EventRepo   interfaceevent.RepoEventInterface
	SchoolRepo  interfaceschool.RepoSchoolInterface
	MinioClient *minioclient.MinioClient
}

func NewEventService(eventRepo interfaceevent.RepoEventInterface, schoolRepo interfaceschool.RepoSchoolInterface, minioClient *minioclient.MinioClient) *EventService {
	return &EventService{
		EventRepo:   eventRepo,
		SchoolRepo:  schoolRepo,
		MinioClient: minioClient,
	}
}

func (s *EventService) AddEvent(username string, req dto.AddEvent) (domainevent.Event, error) {
	eventId := utils.CreateUUID()
	phone := utils.NormalizePhoneTo62(req.InstructorPhone)

	data := domainevent.Event{
		ID:              eventId,
		SchoolId:        req.SchoolId,
		Title:           utils.TitleCase(req.Title),
		Description:     req.Description,
		EventDate:       req.EventDate,
		StartTime:       req.StartTime,
		EndTime:         req.EndTime,
		Location:        req.Location,
		DistrictId:      req.DistrictId,
		CityId:          req.CityId,
		ProvinceId:      req.ProvinceId,
		EventType:       req.EventType,
		TargetAudience:  req.TargetAudience,
		AttendeesCount:  req.AttendeesCount,
		InstructorName:  utils.TitleCase(req.InstructorName),
		InstructorPhone: phone,
		Status:          strings.ToLower(req.Status),
		Notes:           req.Notes,
		CreatedAt:       time.Now(),
		CreatedBy:       username,
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

	// Update school data if schoolId is provided
	if req.SchoolId != "" && strings.EqualFold(req.Status, utils.StsCompleted) {
		school, err := s.SchoolRepo.GetByID(req.SchoolId)
		if err == nil {
			school.IsEducated = true
			school.VisitCount++
			now := time.Now()
			school.LastVisitAt = &now
			school.UpdatedBy = username
			err := s.SchoolRepo.Update(school)
			if err != nil {
				return domainevent.Event{}, err
			}
		}
	}

	return data, nil
}

func (s *EventService) GetEventById(id string) (domainevent.Event, error) {
	return s.EventRepo.GetByID(id)
}

func (s *EventService) UpdateEvent(id, username string, req dto.UpdateEvent) (domainevent.Event, error) {
	// Get existing event
	event, err := s.EventRepo.GetByID(id)
	if err != nil {
		return domainevent.Event{}, err
	}

	// Prevent update if event status is final (Completed or Cancelled)
	if strings.EqualFold(event.Status, utils.StsCompleted) || strings.EqualFold(event.Status, utils.StsCancelled) {
		return domainevent.Event{}, fmt.Errorf("cannot update event with status '%s'. Event is already finalized", event.Status)
	}

	// Update fields if provided
	if req.SchoolId != "" {
		event.SchoolId = req.SchoolId
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
	if req.AttendeesCount != 0 {
		event.AttendeesCount = req.AttendeesCount
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

	event.UpdatedAt = time.Now()
	event.UpdatedBy = username

	if err := s.EventRepo.UpdateById(id, event); err != nil {
		return domainevent.Event{}, err
	}

	// Update school data if schoolId is provided
	if req.SchoolId != "" && strings.EqualFold(req.Status, utils.StsCompleted) {
		school, err := s.SchoolRepo.GetByID(req.SchoolId)
		if err == nil {
			school.IsEducated = true
			school.VisitCount++
			now := time.Now()
			school.LastVisitAt = &now
			school.UpdatedBy = username
			err := s.SchoolRepo.Update(school)
			if err != nil {
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

	// Soft delete event
	if err := s.EventRepo.Delete(id); err != nil {
		return err
	}

	return nil
}

// Photo methods
func (s *EventService) AddEventPhotos(eventId, username string, photos []dto.AddEventPhoto) ([]domainevent.EventPhoto, error) {
	// Verify event exists
	if _, err := s.EventRepo.GetByID(eventId); err != nil {
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
		_ = s.MinioClient.DeleteFile(context.Background(), eventPhoto.PhotoUrl)
	}

	return err
}

// AddEventPhotosFromFiles uploads photos to MinIO and saves to database
func (s *EventService) AddEventPhotosFromFiles(ctx context.Context, eventId, username string, files []*multipart.FileHeader, captions []string, photoOrders []string) ([]domainevent.EventPhoto, error) {
	// Verify event exists
	if _, err := s.EventRepo.GetByID(eventId); err != nil {
		return nil, err
	}

	eventPhotos := make([]domainevent.EventPhoto, 0, len(files))

	var photoURL string
	for i, fileHeader := range files {
		// Open file
		file, err := fileHeader.Open()
		if err != nil {
			return nil, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
		}
		defer file.Close()

		// Upload to MinIO
		photoURL, err = s.MinioClient.UploadFile(ctx, file, fileHeader, "event-photos")
		if err != nil {
			return nil, fmt.Errorf("failed to upload file %s to MinIO: %w", fileHeader.Filename, err)
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
		_ = s.MinioClient.DeleteFile(ctx, photoURL)
		return nil, err
	}

	return eventPhotos, nil
}
