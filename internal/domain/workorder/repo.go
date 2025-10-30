package workorder

import "workshop-management/pkg/filter"

type RepoWorkOrder interface {
	Create(workOrder WorkOrder, svcWorkOrders []SvcWorkOrder) error
	GetById(id string) (WorkOrder, error)
	Update(workOrder WorkOrder, data map[string]interface{}) (int64, error)
	Fetch(params filter.BaseParams) ([]WorkOrder, int64, error)
}
