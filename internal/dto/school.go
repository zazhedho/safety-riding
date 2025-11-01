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
