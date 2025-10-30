package workorder

import (
	"errors"
	"time"
	"workshop-management/internal/domain/booking"
	"workshop-management/internal/domain/workorder"
	"workshop-management/internal/dto"
	"workshop-management/pkg/filter"
	"workshop-management/utils"
)

type ServiceWorkOrder struct {
	WorkOrderRepo workorder.RepoWorkOrder
	BookingRepo   booking.RepoBooking
}

func NewServiceWorkOrder(workOrderRepo workorder.RepoWorkOrder, bookingRepo booking.RepoBooking) *ServiceWorkOrder {
	return &ServiceWorkOrder{
		WorkOrderRepo: workOrderRepo,
		BookingRepo:   bookingRepo,
	}
}

func (s *ServiceWorkOrder) CreateFromBooking(bookingId, userId string) (workorder.WorkOrder, error) {
	bookingData, err := s.BookingRepo.GetById(bookingId)
	if err != nil {
		return workorder.WorkOrder{}, err
	}

	// validate booking status
	if bookingData.Status != utils.StsConfirmed {
		return workorder.WorkOrder{}, errors.New("can't create work order")
	}

	woID := utils.CreateUUID()
	wo := workorder.WorkOrder{
		Id:         woID,
		BookingId:  bookingData.Id,
		CustomerId: bookingData.UserId,
		VehicleId:  bookingData.VehicleId,
		Status:     utils.StsOpen, // first status
		CreatedAt:  time.Now(),
		CreatedBy:  userId,
	}

	// create WO detail (service breakdown from booking)
	var woServices []workorder.SvcWorkOrder
	for _, bs := range bookingData.Services {
		woServices = append(woServices, workorder.SvcWorkOrder{
			Id:          utils.CreateUUID(),
			WorkOrderId: woID,
			ServiceId:   bs.Id,
			ServiceName: bs.Name,
			Price:       bs.Price,
			Status:      utils.StsOpen,
			CreatedAt:   time.Now(),
			CreatedBy:   userId,
		})
	}

	if err = s.WorkOrderRepo.Create(wo, woServices); err != nil {
		return workorder.WorkOrder{}, err
	}
	wo.Services = woServices

	return wo, nil
}

func (s *ServiceWorkOrder) AssignMechanic(req dto.AssignMechanic, workOrderId, userId string) (int64, error) {
	wo, err := s.WorkOrderRepo.GetById(workOrderId)
	if err != nil {
		return 0, err
	}

	if wo.Status != utils.StsOpen {
		return 0, errors.New("work order can't be assigned")
	}

	data := map[string]interface{}{
		"mechanic_id": req.MechanicID,
		"status":      utils.StsOnProgress,
		"updated_at":  time.Now(),
		"updated_by":  userId,
	}

	return s.WorkOrderRepo.Update(workorder.WorkOrder{Id: workOrderId}, data)
}

func (s *ServiceWorkOrder) GetById(id string) (workorder.WorkOrder, error) {
	return s.WorkOrderRepo.GetById(id)
}

func (s *ServiceWorkOrder) UpdateStatus(workOrderId, status, userId string) (int64, error) {
	data := map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
		"updated_by": userId,
	}

	return s.WorkOrderRepo.Update(workorder.WorkOrder{Id: workOrderId}, data)
}

func (s *ServiceWorkOrder) Fetch(params filter.BaseParams) ([]workorder.WorkOrder, int64, error) {
	return s.WorkOrderRepo.Fetch(params)
}
