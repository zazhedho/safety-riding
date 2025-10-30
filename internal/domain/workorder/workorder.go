package workorder

import (
	"workshop-management/internal/dto"
	"workshop-management/pkg/filter"
)

type Service interface {
	CreateFromBooking(bookingId, userId string) (WorkOrder, error)
	AssignMechanic(req dto.AssignMechanic, workOrderId, userId string) (int64, error)
	GetById(id string) (WorkOrder, error)
	UpdateStatus(workOrderId, status, userId string) (int64, error)
	Fetch(params filter.BaseParams) ([]WorkOrder, int64, error)
}
