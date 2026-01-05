package servicepolda

import (
	domainpolda "safety-riding/internal/domain/polda"
	"safety-riding/internal/dto"
	interfacepolda "safety-riding/internal/interfaces/polda"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
)

type PoldaAccidentService struct {
	repo interfacepolda.RepositoryPoldaInterface
}

func NewPoldaAccidentService(repo interfacepolda.RepositoryPoldaInterface) *PoldaAccidentService {
	return &PoldaAccidentService{repo: repo}
}

// Compile-time check to ensure PoldaAccidentService implements ServicePoldaInterface
var _ interfacepolda.ServicePoldaInterface = (*PoldaAccidentService)(nil)

func (s *PoldaAccidentService) Create(req *dto.CreatePoldaAccidentRequest, userID string) error {
	// Business validation like accident service
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"total_accidents":     req.TotalAccidents,
		"total_deaths":        req.TotalDeaths,
		"total_severe_injury": req.TotalSevereInjury,
		"total_minor_injury":  req.TotalMinorInjury,
	}); err != nil {
		return err
	}

	data := &domainpolda.PoldaAccident{
		ID:                utils.CreateUUID(),
		PoliceUnit:        req.PoliceUnit,
		TotalAccidents:    req.TotalAccidents,
		TotalDeaths:       req.TotalDeaths,
		TotalSevereInjury: req.TotalSevereInjury,
		TotalMinorInjury:  req.TotalMinorInjury,
		Period:            req.Period,
		CityId:            req.CityId,
		CityName:          req.CityName,
		ProvinceId:        req.ProvinceId,
		ProvinceName:      req.ProvinceName,
		CreatedBy:         userID,
		UpdatedBy:         userID,
	}
	return s.repo.Create(data)
}

func (s *PoldaAccidentService) GetAll(params filter.BaseParams) ([]domainpolda.PoldaAccident, int64, error) {
	return s.repo.GetAll(params)
}

func (s *PoldaAccidentService) GetByID(id string) (*domainpolda.PoldaAccident, error) {
	return s.repo.GetByID(id)
}

func (s *PoldaAccidentService) Update(id string, req *dto.UpdatePoldaAccidentRequest, userID string) error {
	data := &domainpolda.PoldaAccident{
		UpdatedBy: userID,
	}

	if req.PoliceUnit != "" {
		data.PoliceUnit = req.PoliceUnit
	}
	if req.TotalAccidents >= 0 {
		data.TotalAccidents = req.TotalAccidents
	}
	if req.TotalDeaths >= 0 {
		data.TotalDeaths = req.TotalDeaths
	}
	if req.TotalSevereInjury >= 0 {
		data.TotalSevereInjury = req.TotalSevereInjury
	}
	if req.TotalMinorInjury >= 0 {
		data.TotalMinorInjury = req.TotalMinorInjury
	}
	if req.Period != "" {
		data.Period = req.Period
	}
	if req.CityId != "" {
		data.CityId = req.CityId
	}
	if req.CityName != "" {
		data.CityName = req.CityName
	}
	if req.ProvinceId != "" {
		data.ProvinceId = req.ProvinceId
	}
	if req.ProvinceName != "" {
		data.ProvinceName = req.ProvinceName
	}

	return s.repo.Update(id, data)
}

func (s *PoldaAccidentService) Delete(id string) error {
	return s.repo.Delete(id)
}
