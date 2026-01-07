package dto

// DashboardSummary contains aggregated dashboard statistics
type DashboardSummary struct {
	Stats BasicStats `json:"stats"`
}

// BasicStats contains count statistics
type BasicStats struct {
	Schools   int64 `json:"schools"`
	Publics   int64 `json:"publics"`
	Events    int64 `json:"events"`
	Accidents int64 `json:"accidents"`
	Budgets   int64 `json:"budgets"`
}

// DashboardStats contains detailed dashboard statistics
type DashboardStats struct {
	Schools                 int64                    `json:"schools"`
	Publics                 int64                    `json:"publics"`
	Events                  int64                    `json:"events"`
	Accidents               int64                    `json:"accidents"`
	Budgets                 int64                    `json:"budgets"`
	PoldaAccidents          int64                    `json:"polda_accidents"`
	AhassAccidents          int64                    `json:"ahass_accidents"`
	AdditionalStats         AdditionalStats          `json:"additional_stats"`
	AccidentTrends          []AccidentTrendData      `json:"accident_trends"`
	EventDistribution       []EventDistribution      `json:"event_distribution"`
	BudgetUtilization       []BudgetUtilization      `json:"budget_utilization"`
	RecentEvents            []RecentEvent            `json:"recent_events"`
	RecentAccidents         []RecentAccident         `json:"recent_accidents"`
	AccidentRecommendations []AccidentRecommendation `json:"accident_recommendations"`
}

// AdditionalStats contains calculated statistics
type AdditionalStats struct {
	TotalDeaths           int64   `json:"total_deaths"`
	TotalInjured          int64   `json:"total_injured"`
	AvgAttendeesPerEvent  int64   `json:"avg_attendees_per_event"`
	BudgetUtilizationRate float64 `json:"budget_utilization_rate"`
	TrainedSchools        int64   `json:"trained_schools"`
	TrainedPublics        int64   `json:"trained_publics"`
}

// AccidentTrendData represents monthly accident data
type AccidentTrendData struct {
	Period    string `json:"period"` // "Jan 2024"
	Accidents int64  `json:"accidents"`
	Deaths    int64  `json:"deaths"`
	Injured   int64  `json:"injured"`
}

// EventDistribution represents event type distribution
type EventDistribution struct {
	EventType string `json:"event_type"`
	Count     int64  `json:"count"`
}

// BudgetUtilization represents budget data
type BudgetUtilization struct {
	Period    string  `json:"period"`
	Allocated float64 `json:"allocated"`
	Spent     float64 `json:"spent"`
}

// RecentEvent represents recent event summary
type RecentEvent struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	EventType string `json:"event_type"`
	EventDate string `json:"event_date"`
	Location  string `json:"location"`
}

// RecentAccident represents recent accident summary
type RecentAccident struct {
	ID             string `json:"id"`
	PoliceReportNo string `json:"police_report_no"`
	AccidentDate   string `json:"accident_date"`
	Location       string `json:"location"`
	DeathCount     int    `json:"death_count"`
	InjuredCount   int    `json:"injured_count"`
}

// AccidentRecommendation represents district accident recommendation
type AccidentRecommendation struct {
	CityID       string  `json:"city_id"`
	CityName     string  `json:"city_name"`
	DistrictID   string  `json:"district_id"`
	DistrictName string  `json:"district_name"`
	Score        float64 `json:"score"`
	AhassCount   int64   `json:"ahass_count"`
	PoldaCount   int64   `json:"polda_count"`
	TotalCount   int64   `json:"total_count"`
}
