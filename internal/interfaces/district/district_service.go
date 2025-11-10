package interfacedistrict

import domaindistrict "safety-riding/internal/domain/district"

type ServiceDistrictInterface interface {
	GetDistrict(year, lvl, pro, kab string) ([]domaindistrict.District, error)
}
