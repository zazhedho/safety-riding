package interfaceappconfig

import (
	domainappconfig "safety-riding/internal/domain/appconfig"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceAppConfigInterface interface {
	GetAll(params filter.BaseParams) ([]domainappconfig.AppConfig, int64, error)
	IsEnabled(configKey string, fallback bool) (bool, error)
	Update(id string, req dto.UpdateAppConfig) (domainappconfig.AppConfig, error)
}
