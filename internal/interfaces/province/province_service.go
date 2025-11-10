package interfaceprovince

import domainprovince "safety-riding/internal/domain/province"

type ServiceProvinceInterface interface {
	GetProvince(year string) ([]domainprovince.Province, error)
}
