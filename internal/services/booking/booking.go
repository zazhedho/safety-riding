package booking

import (
	"fmt"
	"strings"
	"time"
	"workshop-management/internal/domain/booking"
	"workshop-management/internal/dto"
	"workshop-management/pkg/filter"
	"workshop-management/utils"
)

type ServiceBooking struct {
	BookingRepo booking.RepoBooking
}

func NewServiceBooking(bookingRepo booking.RepoBooking) *ServiceBooking {
	return &ServiceBooking{
		BookingRepo: bookingRepo,
	}
}

func (s *ServiceBooking) Create(userId string, req dto.CreateBooking) (booking.Booking, error) {
	bookingID := utils.CreateUUID()
	bookingData := booking.Booking{
		Id:          bookingID,
		UserId:      userId,
		VehicleId:   req.VehicleID,
		BookingDate: req.BookingDate,
		Notes:       req.Notes,
		Status:      utils.StsPending,
		CreatedAt:   time.Now(),
	}

	var bookingServices []booking.BookService

	for _, serviceID := range req.ServiceIDs {
		bookingServices = append(bookingServices, booking.BookService{
			Id:        utils.CreateUUID(),
			BookingID: bookingID,
			ServiceID: serviceID,
		})
	}
	dataService, err := s.BookingRepo.GetServicesByIDs(req.ServiceIDs)
	if err != nil {
		return booking.Booking{}, err
	}
	bookingData.Services = dataService

	if err := s.BookingRepo.Create(bookingData, bookingServices); err != nil {
		return booking.Booking{}, err
	}

	return bookingData, nil
}

func (s *ServiceBooking) GetByID(id string) (booking.Booking, error) {
	bookingData, err := s.BookingRepo.GetById(id)
	if err != nil {
		return booking.Booking{}, err
	}

	return bookingData, nil
}

func (s *ServiceBooking) Fetch(params filter.BaseParams) ([]booking.Booking, int64, error) {
	return s.BookingRepo.Fetch(params)
}

func (s *ServiceBooking) UpdateStatus(id, userId, role string, req dto.UpdateBookingStatus) (int64, error) {
	bookingData, err := s.BookingRepo.GetById(id)
	if err != nil {
		return 0, err
	}

	newStatus := strings.ToLower(req.Status)
	var data map[string]interface{}

	switch bookingData.Status {
	case utils.StsPending:
		switch role {
		case utils.RoleCustomer:
			if newStatus == utils.StsCancelled {
				data = utils.UpdateStatus(userId, newStatus)
			}
		case utils.RoleAdmin, utils.RoleCashier:
			if newStatus == utils.StsConfirmed || newStatus == utils.StsCancelled {
				data = utils.UpdateStatus(userId, newStatus)
			}
		}

	case utils.StsConfirmed:
		switch role {
		case utils.RoleAdmin, utils.RoleCashier:
			if newStatus == utils.StsOnProgress || newStatus == utils.StsCancelled {
				data = utils.UpdateStatus(userId, newStatus)
			}
		}

	case utils.StsOnProgress:
		switch role {
		case utils.RoleAdmin, utils.RoleCashier:
			if newStatus == utils.StsCompleted || newStatus == utils.StsCancelled {
				data = utils.UpdateStatus(userId, newStatus)
			}
		}
	default:
		return 0, fmt.Errorf("cannot update booking with status %s", bookingData.Status)
	}

	if data == nil {
		return 0, fmt.Errorf("role %s is not allowed to update booking with status %s", role, bookingData.Status)
	}

	return s.BookingRepo.Update(booking.Booking{Id: id}, data)
}
