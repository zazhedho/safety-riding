package serviceevent

import (
	"safety-riding/utils"
	"time"
)

// markSchoolAsEducated updates school to educated status when event is completed
func (s *EventService) markSchoolAsEducated(schoolId, username, eventDate, endTime string) error {
	school, err := s.SchoolRepo.GetByID(schoolId)
	if err != nil {
		return nil // Ignore error if school not found
	}

	school.IsEducated = true
	school.VisitCount++
	school.LastVisitAt = s.getEventDateTime(eventDate, endTime)
	school.UpdatedBy = username

	return s.SchoolRepo.Update(school)
}

// markPublicAsEducated updates public entity to educated status when event is completed
func (s *EventService) markPublicAsEducated(publicId, username, eventDate, endTime string) error {
	public, err := s.PublicRepo.GetByID(publicId)
	if err != nil {
		return nil // Ignore error if public not found
	}

	public.IsEducated = true
	public.VisitCount++
	public.LastVisitAt = s.getEventDateTime(eventDate, endTime)
	public.UpdatedBy = username

	return s.PublicRepo.Update(public)
}

// getEventDateTime parses event date and time, fallback to current time if parsing fails
func (s *EventService) getEventDateTime(eventDate, endTime string) *time.Time {
	eventDateTime, err := utils.ParseEventDateTime(eventDate, endTime)
	if err != nil {
		now := time.Now()
		return &now
	}
	return &eventDateTime
}
