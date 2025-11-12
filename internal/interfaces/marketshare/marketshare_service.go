package interfacemarketshare

import (
	domainmarketshare "safety-riding/internal/domain/marketshare"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceMarketShareInterface interface {
	AddMarketShare(username string, req dto.AddMarketShare) (domainmarketshare.MarketShare, error)
	GetMarketShareById(id string) (domainmarketshare.MarketShare, error)
	UpdateMarketShare(id, username string, req dto.UpdateMarketShare) (domainmarketshare.MarketShare, error)
	FetchMarketShare(params filter.BaseParams) ([]domainmarketshare.MarketShare, int64, error)
	DeleteMarketShare(id, username string) error
	GetTopDistricts(year, month, limit int) ([]domainmarketshare.TopDistrict, error)
	GetTopCities(year, month, limit int) ([]domainmarketshare.TopCity, error)
	GetSummary(level string, year, month int, provinceID, cityID, districtID string) ([]domainmarketshare.MarketShareSummary, error)
}
