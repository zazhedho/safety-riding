package serviceappconfig

import (
	"errors"
	domainappconfig "safety-riding/internal/domain/appconfig"
	"safety-riding/internal/dto"
	interfaceappconfig "safety-riding/internal/interfaces/appconfig"
	"safety-riding/pkg/filter"
	"strconv"
	"time"

	"gorm.io/gorm"
)

type AppConfigService struct {
	Repo interfaceappconfig.RepoAppConfigInterface
}

func NewAppConfigService(repo interfaceappconfig.RepoAppConfigInterface) *AppConfigService {
	return &AppConfigService{Repo: repo}
}

func (s *AppConfigService) GetAll(params filter.BaseParams) ([]domainappconfig.AppConfig, int64, error) {
	return s.Repo.GetAll(params)
}

func (s *AppConfigService) IsEnabled(configKey string, fallback bool) (bool, error) {
	config, err := s.Repo.GetByKey(configKey)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fallback, nil
		}
		return fallback, err
	}

	if !config.IsActive {
		return false, nil
	}

	value, err := strconv.ParseBool(config.Value)
	if err != nil {
		return fallback, err
	}

	return value, nil
}

func (s *AppConfigService) Update(id string, req dto.UpdateAppConfig) (domainappconfig.AppConfig, error) {
	config, err := s.Repo.GetByID(id)
	if err != nil {
		return domainappconfig.AppConfig{}, err
	}

	config.Value = req.Value
	if req.IsActive != nil {
		config.IsActive = *req.IsActive
	}
	now := time.Now()
	config.UpdatedAt = &now

	if err := s.Repo.Update(config); err != nil {
		return domainappconfig.AppConfig{}, err
	}

	return config, nil
}

var _ interfaceappconfig.ServiceAppConfigInterface = (*AppConfigService)(nil)
