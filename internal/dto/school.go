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
