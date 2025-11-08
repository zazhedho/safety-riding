package domainpublic

import (
	"time"

	"gorm.io/gorm"
)

func (Public) TableName() string {
	return "publics"
}

type Public struct {
	ID            string  `json:"id" gorm:"column:id;primaryKey"`
	Name          string  `json:"name" gorm:"column:name"`
	Category      string  `json:"category" gorm:"column:category"`
	Address       string  `json:"address" gorm:"column:address"`
	Phone         string  `json:"phone" gorm:"column:phone"`
	Email         string  `json:"email" gorm:"column:email"`
	DistrictId    string  `json:"district_id" gorm:"column:district_id"`
	DistrictName  string  `json:"district_name" gorm:"column:district_name"`
	CityId        string  `json:"city_id" gorm:"column:city_id"`
	CityName      string  `json:"city_name" gorm:"column:city_name"`
	ProvinceId    string  `json:"province_id" gorm:"column:province_id"`
	ProvinceName  string  `json:"province_name" gorm:"column:province_name"`
	PostalCode    string  `json:"postal_code" gorm:"column:postal_code"`
	Latitude      float64 `json:"latitude" gorm:"column:latitude"`
	Longitude     float64 `json:"longitude" gorm:"column:longitude"`
	EmployeeCount int     `json:"employee_count" gorm:"column:employee_count"`
	VisitCount    int     `json:"visit_count" gorm:"column:visit_count"`
	IsEducated    bool    `json:"is_educated" gorm:"column:is_educated"`

	LastVisitAt *time.Time     `json:"last_visit_at" gorm:"column:last_visit_at"`
	CreatedAt   time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy   string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt   time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy   string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt   gorm.DeletedAt `json:"-"`
	DeletedBy   string         `json:"-"`
}
