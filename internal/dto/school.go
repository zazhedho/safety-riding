package dto

import "time"

type AddSchool struct {
	Name         string  `json:"name" binding:"required,min=3,max=100"`
	NPSN         string  `json:"npsn" binding:"required,min=3,max=100"`
	Address      string  `json:"address" binding:"required,min=3,max=100"`
	Phone        string  `json:"phone" binding:"required,min=5,max=20"`
	Email        string  `json:"email" binding:"required,email"`
	DistrictId   string  `json:"district_id" binding:"required"`
	DistrictName string  `json:"district_name" binding:"required"`
	CityId       string  `json:"city_id" binding:"required"`
	CityName     string  `json:"city_name" binding:"required"`
	ProvinceId   string  `json:"province_id" binding:"required"`
	ProvinceName string  `json:"province_name" binding:"required"`
	PostalCode   string  `json:"postal_code,omitempty"`
	Latitude     float64 `json:"latitude,omitempty"`
	Longitude    float64 `json:"longitude,omitempty"`
	StudentCount int     `json:"student_count,omitempty"`
	TeacherCount int     `json:"teacher_count,omitempty"`
	MajorCount   int     `json:"major_count,omitempty"`
	VisitCount   int     `json:"visit_count,omitempty"`
	IsEducated   bool    `json:"is_educated,omitempty"`

	LastVisitAt *time.Time `json:"last_visit_at,omitempty"`
}

type UpdateSchool struct {
	Name         string  `json:"name" binding:"omitempty,min=3,max=100"`
	NPSN         string  `json:"npsn" binding:"omitempty,min=3,max=100"`
	Address      string  `json:"address" binding:"omitempty,min=3,max=100"`
	Phone        string  `json:"phone" binding:"omitempty,min=5,max=20"`
	Email        string  `json:"email" binding:"omitempty,email"`
	DistrictId   string  `json:"district_id" binding:"omitempty"`
	DistrictName string  `json:"district_name" binding:"omitempty"`
	CityId       string  `json:"city_id" binding:"omitempty"`
	CityName     string  `json:"city_name" binding:"omitempty"`
	ProvinceId   string  `json:"province_id" binding:"omitempty"`
	ProvinceName string  `json:"province_name" binding:"omitempty"`
	PostalCode   string  `json:"postal_code,omitempty"`
	Latitude     float64 `json:"latitude,omitempty"`
	Longitude    float64 `json:"longitude,omitempty"`
	StudentCount int     `json:"student_count,omitempty"`
	TeacherCount int     `json:"teacher_count,omitempty"`
	MajorCount   int     `json:"major_count,omitempty"`
	VisitCount   int     `json:"visit_count,omitempty"`
	IsEducated   bool    `json:"is_educated,omitempty"`

	LastVisitAt *time.Time `json:"last_visit_at,omitempty"`
}

// SchoolEducationStats represents education statistics for a school
type SchoolEducationStats struct {
	ID                   string `json:"id"`
	Name                 string `json:"name"`
	NPSN                 string `json:"npsn"`
	DistrictId           string `json:"district_id"`
	DistrictName         string `json:"district_name"`
	CityId               string `json:"city_id"`
	CityName             string `json:"city_name"`
	ProvinceId           string `json:"province_id"`
	ProvinceName         string `json:"province_name"`
	StudentCount         int    `json:"student_count"`
	IsEducated           bool   `json:"is_educated"`
	TotalStudentEducated int    `json:"total_student_educated"`
}

// SchoolEducationStatsResponse represents the complete education statistics response
type SchoolEducationStatsResponse struct {
	Schools              []SchoolEducationStats `json:"schools"`
	TotalAllStudents     int                    `json:"total_all_students"`
	TotalSchools         int                    `json:"total_schools"`
	TotalEducatedSchools int                    `json:"total_educated_schools"`
}

// EducationPriorityItem represents a single item in the education priority matrix
type EducationPriorityItem struct {
	// Location information
	ProvinceId   string `json:"province_id"`
	ProvinceName string `json:"province_name"`
	CityId       string `json:"city_id"`
	CityName     string `json:"city_name"`
	DistrictId   string `json:"district_id"`
	DistrictName string `json:"district_name"`

	// Market share data
	MarketShare        float64 `json:"market_share"`
	TotalSales         float64 `json:"total_sales"`
	CompetitorShare    float64 `json:"competitor_share"`
	IsBelowThreshold   bool    `json:"is_below_threshold"`   // true if market share < 87%
	SafetyRidingStatus string  `json:"safety_riding_status"` // "Mandatory" or "Optional"

	// School data
	TotalSchools         int `json:"total_schools"`
	TotalStudents        int `json:"total_students"`
	EducatedSchools      int `json:"educated_schools"`
	TotalStudentEducated int `json:"total_student_educated"`

	// Accident data
	TotalAccidents   int `json:"total_accidents"`
	TotalDeaths      int `json:"total_deaths"`
	TotalInjured     int `json:"total_injured"`
	AccidentSeverity int `json:"accident_severity"` // weighted score

	// Priority calculation
	PriorityScore int    `json:"priority_score"` // 0-100, higher = more priority
	PriorityLevel string `json:"priority_level"` // "Critical", "High", "Medium", "Low"
}

// EducationPriorityResponse represents the complete education priority matrix response
type EducationPriorityResponse struct {
	Items             []EducationPriorityItem `json:"items"`
	TotalItems        int                     `json:"total_items"`
	CriticalCount     int                     `json:"critical_count"`
	HighPriorityCount int                     `json:"high_priority_count"`
	MediumCount       int                     `json:"medium_count"`
	LowCount          int                     `json:"low_count"`
	MarketThreshold   float64                 `json:"market_threshold"` // 87%
}
