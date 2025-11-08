package dto

import "time"

type AddPublic struct {
	Name          string  `json:"name" binding:"required,min=3,max=200"`
	Category      string  `json:"category" binding:"required"`
	Address       string  `json:"address" binding:"required,min=3,max=500"`
	Phone         string  `json:"phone" binding:"omitempty,min=5,max=20"`
	Email         string  `json:"email" binding:"omitempty,email"`
	DistrictId    string  `json:"district_id" binding:"required"`
	DistrictName  string  `json:"district_name" binding:"required"`
	CityId        string  `json:"city_id" binding:"required"`
	CityName      string  `json:"city_name" binding:"required"`
	ProvinceId    string  `json:"province_id" binding:"required"`
	ProvinceName  string  `json:"province_name" binding:"required"`
	PostalCode    string  `json:"postal_code,omitempty"`
	Latitude      float64 `json:"latitude,omitempty"`
	Longitude     float64 `json:"longitude,omitempty"`
	EmployeeCount int     `json:"employee_count,omitempty"`
	VisitCount    int     `json:"visit_count,omitempty"`
	IsEducated    bool    `json:"is_educated,omitempty"`

	LastVisitAt *time.Time `json:"last_visit_at,omitempty"`
}

type UpdatePublic struct {
	Name          string  `json:"name" binding:"omitempty,min=3,max=200"`
	Category      string  `json:"category" binding:"omitempty"`
	Address       string  `json:"address" binding:"omitempty,min=3,max=500"`
	Phone         string  `json:"phone" binding:"omitempty,min=5,max=20"`
	Email         string  `json:"email" binding:"omitempty,email"`
	DistrictId    string  `json:"district_id" binding:"omitempty"`
	DistrictName  string  `json:"district_name" binding:"omitempty"`
	CityId        string  `json:"city_id" binding:"omitempty"`
	CityName      string  `json:"city_name" binding:"omitempty"`
	ProvinceId    string  `json:"province_id" binding:"omitempty"`
	ProvinceName  string  `json:"province_name" binding:"omitempty"`
	PostalCode    string  `json:"postal_code,omitempty"`
	Latitude      float64 `json:"latitude,omitempty"`
	Longitude     float64 `json:"longitude,omitempty"`
	EmployeeCount int     `json:"employee_count,omitempty"`
	VisitCount    int     `json:"visit_count,omitempty"`
	IsEducated    bool    `json:"is_educated,omitempty"`

	LastVisitAt *time.Time `json:"last_visit_at,omitempty"`
}

// PublicEducationStats represents education statistics for a public entity
type PublicEducationStats struct {
	ID                    string `json:"id"`
	Name                  string `json:"name"`
	Category              string `json:"category"`
	DistrictId            string `json:"district_id"`
	DistrictName          string `json:"district_name"`
	CityId                string `json:"city_id"`
	CityName              string `json:"city_name"`
	ProvinceId            string `json:"province_id"`
	ProvinceName          string `json:"province_name"`
	EmployeeCount         int    `json:"employee_count"`
	IsEducated            bool   `json:"is_educated"`
	TotalEmployeeEducated int    `json:"total_employee_educated"`
}

// PublicEducationStatsResponse represents the complete education statistics response
type PublicEducationStatsResponse struct {
	Publics              []PublicEducationStats `json:"publics"`
	TotalAllEmployees    int                    `json:"total_all_employees"`
	TotalPublics         int                    `json:"total_publics"`
	TotalEducatedPublics int                    `json:"total_educated_publics"`
}
