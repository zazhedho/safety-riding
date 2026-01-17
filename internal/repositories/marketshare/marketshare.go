package repositorymarketshare

import (
	"fmt"
	"math"
	"strconv"
	"strings"

	domainmarketshare "safety-riding/internal/domain/marketshare"
	interfacemarketshare "safety-riding/internal/interfaces/marketshare"
	"safety-riding/pkg/filter"

	"gorm.io/gorm"
)

type marketShareRepository struct {
	db *gorm.DB
}

func NewMarketShareRepository(db *gorm.DB) interfacemarketshare.RepoMarketShareInterface {
	return &marketShareRepository{db: db}
}

func (r *marketShareRepository) Create(marketShare domainmarketshare.MarketShare) error {
	return r.db.Create(&marketShare).Error
}

func (r *marketShareRepository) GetByID(id string) (domainmarketshare.MarketShare, error) {
	var marketShare domainmarketshare.MarketShare
	err := r.db.Where("id = ?", id).First(&marketShare).Error
	return marketShare, err
}

func (r *marketShareRepository) Update(marketShare domainmarketshare.MarketShare) error {
	return r.db.Save(&marketShare).Error
}

func (r *marketShareRepository) UpdateById(id string, marketShare domainmarketshare.MarketShare) error {
	return r.db.Model(&domainmarketshare.MarketShare{}).Where("id = ?", id).Updates(&marketShare).Error
}

func (r *marketShareRepository) Fetch(params filter.BaseParams) ([]domainmarketshare.MarketShare, int64, error) {
	var marketShares []domainmarketshare.MarketShare
	var totalData int64

	query := r.db.Model(&domainmarketshare.MarketShare{}).
		Where("deleted_at IS NULL")

	// Apply filters
	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch strings.ToLower(key) {
		case "province_id", "city_id", "district_id":
			val := fmt.Sprintf("%v", value)
			if val != "" {
				query = query.Where(fmt.Sprintf("%s = ?", key), val)
			}
		case "month":
			if month, err := toInt(value); err == nil && month >= 1 && month <= 12 {
				query = query.Where("month = ?", month)
			}
		case "year":
			if year, err := toInt(value); err == nil {
				query = query.Where("year = ?", year)
			}
		}
	}

	// Apply search
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where(
			"province_name ILIKE ? OR city_name ILIKE ? OR district_name ILIKE ?",
			searchPattern, searchPattern, searchPattern,
		)
	}

	// Count total
	if err := query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting, limit, and offset
	if params.OrderBy != "" {
		query = query.Order(params.OrderBy + " " + params.OrderDirection)
	}

	if err := query.Limit(params.Limit).Offset((params.Page - 1) * params.Limit).Find(&marketShares).Error; err != nil {
		return nil, 0, err
	}

	return marketShares, totalData, nil
}

func (r *marketShareRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domainmarketshare.MarketShare{}).Error
}

func toInt(value interface{}) (int, error) {
	switch v := value.(type) {
	case int:
		return v, nil
	case int32:
		return int(v), nil
	case int64:
		return int(v), nil
	case float32:
		return int(v), nil
	case float64:
		return int(v), nil
	case string:
		return strconv.Atoi(strings.TrimSpace(v))
	default:
		return 0, fmt.Errorf("unsupported type for integer conversion")
	}
}

// GetTopDistricts returns top performing districts by sales
func (r *marketShareRepository) GetTopDistricts(year, month int, limit int) ([]domainmarketshare.TopDistrict, error) {
	var results []domainmarketshare.TopDistrict

	query := r.db.Model(&domainmarketshare.MarketShare{}).
		Select(`
			province_id,
			province_name,
			city_id,
			city_name,
			district_id,
			district_name,
			COALESCE(SUM(monthly_sales), 0) as total_sales,
			COALESCE(AVG(monthly_sales_percentage), 0) as market_share,
			COALESCE(SUM(monthly_competitor_sales), 0) as competitor_sales,
			COALESCE(AVG(monthly_competitor_percentage), 0) as competitor_share,
			COALESCE(SUM(monthly_sales - monthly_competitor_sales), 0) as monthly_difference,
			0 as recommend_score
		`).
		Where("deleted_at IS NULL")

	if year > 0 {
		query = query.Where("year = ?", year)
	}

	if month > 0 {
		query = query.Where("month = ?", month)
	}

	err := query.
		Group("province_id, province_name, city_id, city_name, district_id, district_name").
		Order("total_sales DESC").
		Limit(limit).
		Scan(&results).Error

	for idx := range results {
		diff := results[idx].MarketShare - results[idx].CompetitorShare
		score := int(math.Round(diff * 100))
		if score < 0 {
			score = 0
		}
		results[idx].RecommendScore = score
	}

	return results, err
}

func (r *marketShareRepository) GetTopCities(year, month int, limit int, sortOrder string) ([]domainmarketshare.TopCity, error) {
	var results []domainmarketshare.TopCity

	query := r.db.Model(&domainmarketshare.MarketShare{}).
		Select(`
			province_id,
			province_name,
			city_id,
			city_name,
			COALESCE(SUM(monthly_sales), 0) as total_sales,
			COALESCE(AVG(monthly_sales_percentage), 0) as market_share,
			COALESCE(SUM(monthly_competitor_sales), 0) as competitor_sales,
			COALESCE(AVG(monthly_competitor_percentage), 0) as competitor_share,
			COALESCE(SUM(monthly_sales - monthly_competitor_sales), 0) as monthly_difference,
			0 as recommend_score
		`).
		Where("deleted_at IS NULL")

	if year > 0 {
		query = query.Where("year = ?", year)
	}
	if month > 0 {
		query = query.Where("month = ?", month)
	}

	orderBy := "market_share DESC"
	if sortOrder == "asc" {
		orderBy = "market_share ASC"
	}

	err := query.
		Group("province_id, province_name, city_id, city_name").
		Order(orderBy).
		Limit(limit).
		Scan(&results).Error

	for idx := range results {
		diff := results[idx].MarketShare - results[idx].CompetitorShare
		score := int(math.Round(diff * 100))
		if score < 0 {
			score = 0
		}
		results[idx].RecommendScore = score
	}

	return results, err
}

func (r *marketShareRepository) GetSummary(level string, year, month int, provinceID, cityID, districtID string) ([]domainmarketshare.MarketShareSummary, error) {
	var results []domainmarketshare.MarketShareSummary

	query := r.db.Model(&domainmarketshare.MarketShare{}).Where("deleted_at IS NULL")

	if year > 0 {
		query = query.Where("year = ?", year)
	}
	if month > 0 {
		query = query.Where("month = ?", month)
	}
	if provinceID != "" {
		query = query.Where("province_id = ?", provinceID)
	}
	if cityID != "" {
		query = query.Where("city_id = ?", cityID)
	}
	if districtID != "" {
		query = query.Where("district_id = ?", districtID)
	}

	level = strings.ToLower(level)
	switch level {
	case "province":
		query = query.Select(`
			province_id,
			province_name,
			'' AS city_id,
			'' AS city_name,
			'' AS district_id,
			'' AS district_name,
			COALESCE(SUM(monthly_sales), 0) as total_monthly_sales,
			COALESCE(SUM(yearly_sales), 0) as total_yearly_sales,
			COALESCE(SUM(monthly_competitor_sales), 0) as total_monthly_competitor_sales,
			COALESCE(SUM(yearly_competitor_sales), 0) as total_yearly_competitor_sales,
			COALESCE(AVG(monthly_sales_percentage), 0) as avg_monthly_market_share,
			COALESCE(AVG(yearly_sales_percentage), 0) as avg_yearly_market_share,
			COALESCE(AVG(monthly_competitor_percentage), 0) as avg_monthly_competitor_share,
			COALESCE(AVG(yearly_competitor_percentage), 0) as avg_yearly_competitor_share
		`).Group("province_id, province_name").
			Order("total_yearly_sales DESC")
	case "city":
		query = query.Select(`
			province_id,
			province_name,
			city_id,
			city_name,
			'' AS district_id,
			'' AS district_name,
			COALESCE(SUM(monthly_sales), 0) as total_monthly_sales,
			COALESCE(SUM(yearly_sales), 0) as total_yearly_sales,
			COALESCE(SUM(monthly_competitor_sales), 0) as total_monthly_competitor_sales,
			COALESCE(SUM(yearly_competitor_sales), 0) as total_yearly_competitor_sales,
			COALESCE(AVG(monthly_sales_percentage), 0) as avg_monthly_market_share,
			COALESCE(AVG(yearly_sales_percentage), 0) as avg_yearly_market_share,
			COALESCE(AVG(monthly_competitor_percentage), 0) as avg_monthly_competitor_share,
			COALESCE(AVG(yearly_competitor_percentage), 0) as avg_yearly_competitor_share
		`).Group("province_id, province_name, city_id, city_name").
			Order("total_yearly_sales DESC")
	case "district":
		query = query.Select(`
			province_id,
			province_name,
			city_id,
			city_name,
			district_id,
			district_name,
			COALESCE(SUM(monthly_sales), 0) as total_monthly_sales,
			COALESCE(SUM(yearly_sales), 0) as total_yearly_sales,
			COALESCE(SUM(monthly_competitor_sales), 0) as total_monthly_competitor_sales,
			COALESCE(SUM(yearly_competitor_sales), 0) as total_yearly_competitor_sales,
			COALESCE(AVG(monthly_sales_percentage), 0) as avg_monthly_market_share,
			COALESCE(AVG(yearly_sales_percentage), 0) as avg_yearly_market_share,
			COALESCE(AVG(monthly_competitor_percentage), 0) as avg_monthly_competitor_share,
			COALESCE(AVG(yearly_competitor_percentage), 0) as avg_yearly_competitor_share
		`).Group("province_id, province_name, city_id, city_name, district_id, district_name").
			Order("total_yearly_sales DESC")
	default:
		return nil, fmt.Errorf("invalid summary level: %s", level)
	}

	err := query.Scan(&results).Error
	return results, err
}

// GetByLocation retrieves market share by specific location and period
func (r *marketShareRepository) GetByLocation(provinceID, cityID, districtID string, year, month int) (domainmarketshare.MarketShare, error) {
	var marketShare domainmarketshare.MarketShare
	err := r.db.Where("province_id = ? AND city_id = ? AND district_id = ? AND year = ? AND month = ?",
		provinceID, cityID, districtID, year, month).
		First(&marketShare).Error
	return marketShare, err
}

// GetSummaryByYear returns aggregated summary by year
func (r *marketShareRepository) GetSummaryByYear(year int) ([]domainmarketshare.MarketShareSummary, error) {
	return r.GetSummary("district", year, 0, "", "", "")
}
