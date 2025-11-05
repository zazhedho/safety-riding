package domainmarketshare

import (
	"time"

	"gorm.io/gorm"
)

func (MarketShare) TableName() string {
	return "market_shares"
}

type MarketShare struct {
	ID string `json:"id" gorm:"column:id;primaryKey"`

	// Location information
	ProvinceID   string `json:"province_id" gorm:"column:province_id"`
	ProvinceName string `json:"province_name" gorm:"column:province_name"`
	CityID       string `json:"city_id" gorm:"column:city_id"`
	CityName     string `json:"city_name" gorm:"column:city_name"`
	DistrictID   string `json:"district_id" gorm:"column:district_id"`
	DistrictName string `json:"district_name" gorm:"column:district_name"`

	// Period information
	Month int `json:"month" gorm:"column:month"`
	Year  int `json:"year" gorm:"column:year"`

	// Company sales data
	MonthlySales           float64 `json:"monthly_sales" gorm:"column:monthly_sales"`
	YearlySales            float64 `json:"yearly_sales" gorm:"column:yearly_sales"`
	MonthlySalesPercentage float64 `json:"monthly_sales_percentage" gorm:"column:monthly_sales_percentage"`
	YearlySalesPercentage  float64 `json:"yearly_sales_percentage" gorm:"column:yearly_sales_percentage"`

	// Competitor sales data
	MonthlyCompetitorSales      float64 `json:"monthly_competitor_sales" gorm:"column:monthly_competitor_sales"`
	YearlyCompetitorSales       float64 `json:"yearly_competitor_sales" gorm:"column:yearly_competitor_sales"`
	MonthlyCompetitorPercentage float64 `json:"monthly_competitor_percentage" gorm:"column:monthly_competitor_percentage"`
	YearlyCompetitorPercentage  float64 `json:"yearly_competitor_percentage" gorm:"column:yearly_competitor_percentage"`

	// Additional info
	Notes string `json:"notes" gorm:"column:notes"`

	// Audit fields
	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`
}

// MarketShareSummary for aggregated data
type MarketShareSummary struct {
	ProvinceID                  string  `json:"province_id"`
	ProvinceName                string  `json:"province_name"`
	CityID                      string  `json:"city_id"`
	CityName                    string  `json:"city_name"`
	DistrictID                  string  `json:"district_id"`
	DistrictName                string  `json:"district_name"`
	TotalMonthlySales           float64 `json:"total_monthly_sales"`
	TotalYearlySales            float64 `json:"total_yearly_sales"`
	TotalMonthlyCompetitorSales float64 `json:"total_monthly_competitor_sales"`
	TotalYearlyCompetitorSales  float64 `json:"total_yearly_competitor_sales"`
	AvgMonthlyMarketShare       float64 `json:"avg_monthly_market_share"`
	AvgYearlyMarketShare        float64 `json:"avg_yearly_market_share"`
	AvgMonthlyCompetitorShare   float64 `json:"avg_monthly_competitor_share"`
	AvgYearlyCompetitorShare    float64 `json:"avg_yearly_competitor_share"`
}

// TopDistrict for dashboard recommendation
type TopDistrict struct {
	ProvinceID        string  `json:"province_id"`
	ProvinceName      string  `json:"province_name"`
	CityID            string  `json:"city_id"`
	CityName          string  `json:"city_name"`
	DistrictID        string  `json:"district_id"`
	DistrictName      string  `json:"district_name"`
	TotalSales        float64 `json:"total_sales"`
	MarketShare       float64 `json:"market_share"`
	CompetitorSales   float64 `json:"competitor_sales"`
	CompetitorShare   float64 `json:"competitor_share"`
	MonthlyDifference float64 `json:"monthly_difference" gorm:"column:monthly_difference"`
	RecommendScore    int     `json:"recommend_score"`
}

// TopCity for dashboard recommendations at city/regency level
type TopCity struct {
	ProvinceID        string  `json:"province_id"`
	ProvinceName      string  `json:"province_name"`
	CityID            string  `json:"city_id"`
	CityName          string  `json:"city_name"`
	TotalSales        float64 `json:"total_sales"`
	MarketShare       float64 `json:"market_share"`
	CompetitorSales   float64 `json:"competitor_sales"`
	RecommendScore    int     `json:"recommend_score"`
	CompetitorShare   float64 `json:"competitor_share"`
	MonthlyDifference float64 `json:"monthly_difference"`
}
