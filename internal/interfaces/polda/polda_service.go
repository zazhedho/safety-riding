package interfacepolda

import (
	domainpolda "safety-riding/internal/domain/polda"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServicePoldaInterface interface {
	Create(req *dto.CreatePoldaAccidentRequest, userID string) error
	GetAll(params filter.BaseParams) ([]domainpolda.PoldaAccident, int64, error)
	GetByID(id string) (*domainpolda.PoldaAccident, error)
	Update(id string, req *dto.UpdatePoldaAccidentRequest, userID string) error
	Delete(id string) error
}
