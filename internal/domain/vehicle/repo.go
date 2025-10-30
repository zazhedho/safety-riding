package vehicle

import "workshop-management/pkg/filter"

type RepoVehicle interface {
	Store(m Vehicle) error
	Fetch(params filter.BaseParams) ([]Vehicle, int64, error)
	GetById(id string) (Vehicle, error)
	Update(m Vehicle, data interface{}) (int64, error)
	Delete(m Vehicle, data interface{}) error
}
