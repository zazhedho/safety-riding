package interfacemarketshare

import (
	domainmarketshare "safety-riding/internal/domain/marketshare"
	"safety-riding/pkg/filter"
)

type RepoMarketShareInterface interface {
	Create(marketShare domainmarketshare.MarketShare) error
	GetByID(id string) (domainmarketshare.MarketShare, error)
	Update(marketShare domainmarketshare.MarketShare) error
	UpdateById(id string, marketShare domainmarketshare.MarketShare) error
	Fetch(params filter.BaseParams) ([]domainmarketshare.MarketShare, int64, error)
	Delete(id string) error

	// Aggregation methods for dashboard
	GetSummary(level string, year, month int, provinceID, cityID, districtID string) ([]domainmarketshare.MarketShareSummary, error)
	GetTopCities(year, month, limit int, sortOrder string) ([]domainmarketshare.TopCity, error)
	GetTopDistricts(year, month int, limit int) ([]domainmarketshare.TopDistrict, error)
	GetByLocation(provinceID, cityID, districtID string, year, month int) (domainmarketshare.MarketShare, error)
	GetSummaryByYear(year int) ([]domainmarketshare.MarketShareSummary, error)
}
