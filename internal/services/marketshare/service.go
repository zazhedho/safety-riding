package servicemarketshare

import (
	domainmarketshare "safety-riding/internal/domain/marketshare"
	"safety-riding/internal/dto"
	interfacemarketshare "safety-riding/internal/interfaces/marketshare"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"time"
)

type MarketShareService struct {
	MarketShareRepo interfacemarketshare.RepoMarketShareInterface
}

func NewMarketShareService(marketShareRepo interfacemarketshare.RepoMarketShareInterface) *MarketShareService {
	return &MarketShareService{
		MarketShareRepo: marketShareRepo,
	}
}

func (s *MarketShareService) AddMarketShare(username string, req dto.AddMarketShare) (domainmarketshare.MarketShare, error) {
	// Validate numeric fields are non-negative
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"monthly_sales":                 req.MonthlySales,
		"yearly_sales":                  req.YearlySales,
		"monthly_competitor_sales":      req.MonthlyCompetitorSales,
		"yearly_competitor_sales":       req.YearlyCompetitorSales,
		"monthly_sales_percentage":      req.MonthlySalesPercentage,
		"yearly_sales_percentage":       req.YearlySalesPercentage,
		"monthly_competitor_percentage": req.MonthlyCompetitorPercentage,
		"yearly_competitor_percentage":  req.YearlyCompetitorPercentage,
	}); err != nil {
		return domainmarketshare.MarketShare{}, err
	}

	data := domainmarketshare.MarketShare{
		ID:                          utils.CreateUUID(),
		ProvinceID:                  req.ProvinceID,
		ProvinceName:                req.ProvinceName,
		CityID:                      req.CityID,
		CityName:                    req.CityName,
		DistrictID:                  req.DistrictID,
		DistrictName:                req.DistrictName,
		Month:                       req.Month,
		Year:                        req.Year,
		MonthlySales:                req.MonthlySales,
		YearlySales:                 req.YearlySales,
		MonthlySalesPercentage:      req.MonthlySalesPercentage,
		YearlySalesPercentage:       req.YearlySalesPercentage,
		MonthlyCompetitorSales:      req.MonthlyCompetitorSales,
		YearlyCompetitorSales:       req.YearlyCompetitorSales,
		MonthlyCompetitorPercentage: req.MonthlyCompetitorPercentage,
		YearlyCompetitorPercentage:  req.YearlyCompetitorPercentage,
		Notes:                       req.Notes,
		CreatedAt:                   time.Now(),
		CreatedBy:                   username,
	}

	if err := s.MarketShareRepo.Create(data); err != nil {
		return domainmarketshare.MarketShare{}, err
	}

	return data, nil
}

func (s *MarketShareService) GetMarketShareById(id string) (domainmarketshare.MarketShare, error) {
	return s.MarketShareRepo.GetByID(id)
}

func (s *MarketShareService) UpdateMarketShare(id, username string, req dto.UpdateMarketShare) (domainmarketshare.MarketShare, error) {
	// Get existing market share
	marketShare, err := s.MarketShareRepo.GetByID(id)
	if err != nil {
		return domainmarketshare.MarketShare{}, err
	}

	// Update fields if provided
	if req.ProvinceID != "" {
		marketShare.ProvinceID = req.ProvinceID
	}
	if req.ProvinceName != "" {
		marketShare.ProvinceName = req.ProvinceName
	}
	if req.CityID != "" {
		marketShare.CityID = req.CityID
	}
	if req.CityName != "" {
		marketShare.CityName = req.CityName
	}
	if req.DistrictID != "" {
		marketShare.DistrictID = req.DistrictID
	}
	if req.DistrictName != "" {
		marketShare.DistrictName = req.DistrictName
	}
	if req.Month != 0 {
		marketShare.Month = req.Month
	}
	if req.Year != 0 {
		marketShare.Year = req.Year
	}
	if req.MonthlySales != 0 {
		marketShare.MonthlySales = req.MonthlySales
	}
	if req.YearlySales != 0 {
		marketShare.YearlySales = req.YearlySales
	}
	if req.MonthlySalesPercentage != 0 {
		marketShare.MonthlySalesPercentage = req.MonthlySalesPercentage
	}
	if req.YearlySalesPercentage != 0 {
		marketShare.YearlySalesPercentage = req.YearlySalesPercentage
	}
	if req.MonthlyCompetitorSales != 0 {
		marketShare.MonthlyCompetitorSales = req.MonthlyCompetitorSales
	}
	if req.YearlyCompetitorSales != 0 {
		marketShare.YearlyCompetitorSales = req.YearlyCompetitorSales
	}
	if req.MonthlyCompetitorPercentage != 0 {
		marketShare.MonthlyCompetitorPercentage = req.MonthlyCompetitorPercentage
	}
	if req.YearlyCompetitorPercentage != 0 {
		marketShare.YearlyCompetitorPercentage = req.YearlyCompetitorPercentage
	}
	if req.Notes != "" {
		marketShare.Notes = req.Notes
	}

	marketShare.UpdatedAt = time.Now()
	marketShare.UpdatedBy = username

	if err := s.MarketShareRepo.UpdateById(id, marketShare); err != nil {
		return domainmarketshare.MarketShare{}, err
	}

	return marketShare, nil
}

func (s *MarketShareService) FetchMarketShare(params filter.BaseParams) ([]domainmarketshare.MarketShare, int64, error) {
	return s.MarketShareRepo.Fetch(params)
}

func (s *MarketShareService) DeleteMarketShare(id, username string) error {
	// Check if market share exists
	marketShare, err := s.MarketShareRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Update deleted fields
	marketShare.DeletedBy = username

	// Soft delete
	if err := s.MarketShareRepo.Delete(id); err != nil {
		return err
	}

	return nil
}

// GetTopDistricts returns top districts by sales
func (s *MarketShareService) GetTopDistricts(year, month, limit int) ([]domainmarketshare.TopDistrict, error) {
	return s.MarketShareRepo.GetTopDistricts(year, month, limit)
}

func (s *MarketShareService) GetTopCities(year, month, limit int) ([]domainmarketshare.TopCity, error) {
	return s.MarketShareRepo.GetTopCities(year, month, limit)
}

func (s *MarketShareService) GetSummary(level string, year, month int, provinceID, cityID, districtID string) ([]domainmarketshare.MarketShareSummary, error) {
	if level == "" {
		level = "province"
	}
	return s.MarketShareRepo.GetSummary(level, year, month, provinceID, cityID, districtID)
}

var _ interfacemarketshare.ServiceMarketShareInterface = (*MarketShareService)(nil)
