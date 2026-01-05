package servicepolda

import (
	domainpolda "safety-riding/internal/domain/polda"
	"safety-riding/internal/dto"
	interfacepolda "safety-riding/internal/interfaces/polda"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"strings"
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
		PoliceUnit:        strings.ToUpper(req.PoliceUnit),
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
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	existing.PoliceUnit = strings.ToUpper(req.PoliceUnit)
	existing.TotalAccidents = req.TotalAccidents
	existing.TotalDeaths = req.TotalDeaths
	existing.TotalSevereInjury = req.TotalSevereInjury
	existing.TotalMinorInjury = req.TotalMinorInjury
	existing.Period = req.Period
	existing.CityId = req.CityId
	existing.CityName = req.CityName
	existing.ProvinceId = req.ProvinceId
	existing.ProvinceName = req.ProvinceName
	existing.UpdatedBy = userID

	return s.repo.Update(existing)
}

func (s *PoldaAccidentService) Delete(id string) error {
	return s.repo.Delete(id)
}
