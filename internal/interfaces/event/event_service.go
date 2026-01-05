package interfaceevent

import (
	"context"
	"mime/multipart"
	"time"

	domainevent "safety-riding/internal/domain/event"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceEventInterface interface {
	AddEvent(username string, req dto.AddEvent) (domainevent.Event, error)
	GetEventById(id string) (domainevent.Event, error)
	UpdateEvent(id, username, role string, req dto.UpdateEvent) (domainevent.Event, error)
	FetchEvent(params filter.BaseParams) ([]domainevent.Event, int64, error)
	DeleteEvent(id, username string) error
	AddEventPhotos(eventId, username string, photos []dto.AddEventPhoto) ([]domainevent.EventPhoto, error)
	DeleteEventPhoto(photoId, username string) error
	AddEventPhotosFromFiles(ctx context.Context, eventId, username string, files []*multipart.FileHeader, captions []string, photoOrders []string) ([]domainevent.EventPhoto, error)
	GetCompletedEventsForMap(since time.Time) ([]dto.EventMapData, error)
}
