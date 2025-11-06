package interfaceevent

import (
	domainevent "safety-riding/internal/domain/event"
	"safety-riding/pkg/filter"
)

type RepoEventInterface interface {
	Create(event domainevent.Event) error
	GetByID(id string) (domainevent.Event, error)
	Update(event domainevent.Event) error
	UpdateById(id string, event domainevent.Event) error
	Fetch(params filter.BaseParams) ([]domainevent.Event, int64, error)
	Delete(id string) error

	// Event Photo methods
	AddPhotos(photos []domainevent.EventPhoto) error
	GetPhotosByEventID(eventId string) ([]domainevent.EventPhoto, error)
	GetPhotoByID(photoId string) (domainevent.EventPhoto, error)
	DeletePhoto(photoId string) error
	DeletePhotosByEventID(eventId string) error

	// On The Spot Sales methods
	AddOnTheSpotSales(sales []domainevent.EventOnTheSpotSale) error
	DeleteOnTheSpotSalesByEventID(eventId string) error
}
