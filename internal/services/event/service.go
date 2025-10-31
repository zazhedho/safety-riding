package serviceevent

import (
	"safety-riding/internal/domain/event"
	"safety-riding/internal/dto"
	interfaceevent "safety-riding/internal/interfaces/event"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"time"
)

type EventService struct {
	EventRepo interfaceevent.RepoEventInterface
}

func NewEventService(eventRepo interfaceevent.RepoEventInterface) *EventService {
	return &EventService{
		EventRepo: eventRepo,
	}
}

func (s *EventService) AddEvent(username string, req dto.AddEvent) (domainevent.Event, error) {
	eventId := utils.CreateUUID()
	phone := utils.NormalizePhoneTo62(req.InstructorPhone)

	data := domainevent.Event{
		ID:              eventId,
		SchoolId:        req.SchoolId,
		Title:           req.Title,
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
		InstructorName:  req.InstructorName,
		InstructorPhone: phone,
		Status:          req.Status,
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

	if err := s.EventRepo.Update(event); err != nil {
		return domainevent.Event{}, err
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
	return s.EventRepo.DeletePhoto(photoId)
}
