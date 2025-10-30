package booking

import (
	"workshop-management/internal/domain/service"
	"workshop-management/pkg/filter"
)

type RepoBooking interface {
	Create(booking Booking, bookingServices []BookService) error
	GetServicesByIDs(serviceIDs []string) ([]service.Service, error)
	GetById(id string) (Booking, error)
	GetByIdUserId(id, userId string) (Booking, error)
	GetBookingServicesByBookingId(bookingId string) ([]BookService, error)
	Fetch(params filter.BaseParams) ([]Booking, int64, error)
	Update(m Booking, data interface{}) (int64, error)
}
