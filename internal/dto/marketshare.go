package dto

type AddMarketShare struct {
	ProvinceID                  string  `json:"province_id" binding:"required"`
	ProvinceName                string  `json:"province_name" binding:"required"`
	CityID                      string  `json:"city_id" binding:"required"`
	CityName                    string  `json:"city_name" binding:"required"`
	DistrictID                  string  `json:"district_id,omitempty"`
	DistrictName                string  `json:"district_name,omitempty"`
	Month                       int     `json:"month" binding:"required,min=1,max=12"`
	Year                        int     `json:"year" binding:"required,min=2000"`
	MonthlySales                float64 `json:"monthly_sales" binding:"required,gte=0"`
	YearlySales                 float64 `json:"yearly_sales" binding:"required,gte=0"`
	MonthlySalesPercentage      float64 `json:"monthly_sales_percentage" binding:"required,gte=0,lte=100"`
	YearlySalesPercentage       float64 `json:"yearly_sales_percentage" binding:"required,gte=0,lte=100"`
	MonthlyCompetitorSales      float64 `json:"monthly_competitor_sales" binding:"gte=0"`
	YearlyCompetitorSales       float64 `json:"yearly_competitor_sales" binding:"gte=0"`
	MonthlyCompetitorPercentage float64 `json:"monthly_competitor_percentage" binding:"gte=0,lte=100"`
	YearlyCompetitorPercentage  float64 `json:"yearly_competitor_percentage" binding:"gte=0,lte=100"`
	Notes                       string  `json:"notes,omitempty"`
}

type UpdateMarketShare struct {
	ProvinceID                  string  `json:"province_id,omitempty"`
	ProvinceName                string  `json:"province_name,omitempty"`
	CityID                      string  `json:"city_id,omitempty"`
	CityName                    string  `json:"city_name,omitempty"`
	DistrictID                  string  `json:"district_id,omitempty"`
	DistrictName                string  `json:"district_name,omitempty"`
	Month                       int     `json:"month,omitempty"`
	Year                        int     `json:"year,omitempty"`
	MonthlySales                float64 `json:"monthly_sales,omitempty"`
	YearlySales                 float64 `json:"yearly_sales,omitempty"`
	MonthlySalesPercentage      float64 `json:"monthly_sales_percentage,omitempty"`
	YearlySalesPercentage       float64 `json:"yearly_sales_percentage,omitempty"`
	MonthlyCompetitorSales      float64 `json:"monthly_competitor_sales,omitempty"`
	YearlyCompetitorSales       float64 `json:"yearly_competitor_sales,omitempty"`
	MonthlyCompetitorPercentage float64 `json:"monthly_competitor_percentage,omitempty"`
	YearlyCompetitorPercentage  float64 `json:"yearly_competitor_percentage,omitempty"`
	Notes                       string  `json:"notes,omitempty"`
}
