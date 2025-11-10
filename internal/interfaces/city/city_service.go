package interfacecity

import domaincity "safety-riding/internal/domain/city"

type ServiceCityInterface interface {
	GetCity(year, lvl, pro string) ([]domaincity.City, error)
}
