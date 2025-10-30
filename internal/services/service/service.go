package service

import (
	"time"
	"workshop-management/internal/domain/service"
	"workshop-management/internal/dto"
	"workshop-management/pkg/filter"
	"workshop-management/utils"
)

type SrvService struct {
	ServiceRepo service.RepoService
}

func NewSrvService(serviceRepo service.RepoService) *SrvService {
	return &SrvService{
		ServiceRepo: serviceRepo,
	}
}

func (s *SrvService) Create(userId string, req dto.AddService) (service.Service, error) {
	data := service.Service{
		Id:          utils.CreateUUID(),
		Name:        utils.TitleCase(req.Name),
		Description: req.Description,
		Price:       req.Price,
		CreatedAt:   time.Now(),
		CreatedBy:   userId,
	}

	if err := s.ServiceRepo.Store(data); err != nil {
		return service.Service{}, err
	}

	return data, nil
}

func (s *SrvService) Fetch(params filter.BaseParams) ([]service.Service, int64, error) {
	return s.ServiceRepo.Fetch(params)
}

func (s *SrvService) GetById(id string) (service.Service, error) {
	return s.ServiceRepo.GetById(id)
}

func (s *SrvService) Update(userId, id string, req dto.UpdateService) (int64, error) {
	data := service.Service{
		Name:        utils.TitleCase(req.Name),
		Description: req.Description,
		Price:       req.Price,
		UpdatedBy:   userId,
		UpdatedAt:   time.Now(),
	}

	return s.ServiceRepo.Update(service.Service{Id: id}, data)
}

func (s *SrvService) Delete(userId, id string) error {
	data := map[string]interface{}{
		"deleted_by": userId,
		"deleted_at": time.Now(),
	}

	return s.ServiceRepo.Delete(service.Service{Id: id}, data)
}
