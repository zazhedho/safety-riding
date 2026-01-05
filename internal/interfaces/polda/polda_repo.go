package interfacepolda

import (
	domainpolda "safety-riding/internal/domain/polda"
	"safety-riding/pkg/filter"
)

type RepositoryPoldaInterface interface {
	Create(data *domainpolda.PoldaAccident) error
	GetAll(params filter.BaseParams) ([]domainpolda.PoldaAccident, int64, error)
	GetByID(id string) (*domainpolda.PoldaAccident, error)
	Update(data *domainpolda.PoldaAccident) error
	Delete(id string) error
}
