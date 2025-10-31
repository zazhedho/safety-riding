package domainschool

import (
	"time"

	"gorm.io/gorm"
)

func (School) TableName() string {
	return "schools"
}

type School struct {
	ID           string  `json:"id" gorm:"column:id;primaryKey"`
	Name         string  `json:"name" gorm:"column:name"`
	NPSN         string  `json:"npsn" gorm:"column:npsn"`
	Address      string  `json:"address" gorm:"column:address"`
	Phone        string  `json:"phone" gorm:"column:phone"`
	Email        string  `json:"email" gorm:"column:email"`
	DistrictId   string  `json:"district_id" gorm:"column:district_id"`
	DistrictName string  `json:"district_name" gorm:"column:district_name"`
	CityId       string  `json:"city_id" gorm:"column:city_id"`
	CityName     string  `json:"city_name" gorm:"column:city_name"`
	ProvinceId   string  `json:"province_id" gorm:"column:province_id"`
	ProvinceName string  `json:"province_name" gorm:"column:province_name"`
	PostalCode   string  `json:"postal_code" gorm:"column:postal_code"`
	Latitude     float64 `json:"latitude" gorm:"column:latitude"`
	Longitude    float64 `json:"longitude" gorm:"column:longitude"`
	StudentCount int     `json:"student_count" gorm:"column:student_count"`
	TeacherCount int     `json:"teacher_count" gorm:"column:teacher_count"`
	MajorCount   int     `json:"major_count" gorm:"column:major_count"`
	VisitCount   int     `json:"visit_count" gorm:"column:visit_count"`
	IsEducated   bool    `json:"is_educated" gorm:"column:is_educated"`

	LastVisitAt *time.Time     `json:"last_visit_at" gorm:"column:last_visit_at"`
	CreatedAt   time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy   string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt   time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy   string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt   gorm.DeletedAt `json:"-"`
	DeletedBy   string         `json:"-"`
}
