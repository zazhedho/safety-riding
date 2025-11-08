package domainaccident

import (
	"time"

	"gorm.io/gorm"
)

func (Accident) TableName() string {
	return "accidents"
}

type Accident struct {
	ID                string  `json:"id" gorm:"column:id;primaryKey"`
	PoliceReportNo    string  `json:"police_report_no" gorm:"column:police_report_no"`
	AccidentDate      string  `json:"accident_date" gorm:"column:accident_date"`
	AccidentTime      string  `json:"accident_time" gorm:"column:accident_time"`
	Location          string  `json:"location" gorm:"column:location"`
	DistrictId        string  `json:"district_id" gorm:"column:district_id"`
	DistrictName      string  `json:"district_name" gorm:"column:district_name"`
	CityId            string  `json:"city_id" gorm:"column:city_id"`
	CityName          string  `json:"city_name" gorm:"column:city_name"`
	ProvinceId        string  `json:"province_id" gorm:"column:province_id"`
	ProvinceName      string  `json:"province_name" gorm:"column:province_name"`
	Latitude          float64 `json:"latitude" gorm:"column:latitude"`
	Longitude         float64 `json:"longitude" gorm:"column:longitude"`
	RoadType          string  `json:"road_type" gorm:"column:road_type"`
	WeatherCondition  string  `json:"weather_condition" gorm:"column:weather_condition"`
	RoadCondition     string  `json:"road_condition" gorm:"column:road_condition"`
	VehicleType       string  `json:"vehicle_type" gorm:"column:vehicle_type"`
	AccidentType      string  `json:"accident_type" gorm:"column:accident_type"`
	DeathCount        int     `json:"death_count" gorm:"column:death_count"`
	InjuredCount      int     `json:"injured_count" gorm:"column:injured_count"`
	MinorInjuredCount int     `json:"minor_injured_count" gorm:"column:minor_injured_count"`
	VehicleCount      int     `json:"vehicle_count" gorm:"column:vehicle_count"`
	CauseOfAccident   string  `json:"cause_of_accident" gorm:"column:cause_of_accident"`
	Description       string  `json:"description" gorm:"column:description"`
	PoliceStation     string  `json:"police_station" gorm:"column:police_station"`
	OfficerName       string  `json:"officer_name" gorm:"column:officer_name"`

	Photos []AccidentPhoto `json:"photos,omitempty" gorm:"foreignKey:AccidentId;constraint:OnDelete:CASCADE"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`
}

func (AccidentPhoto) TableName() string {
	return "accident_photos"
}

type AccidentPhoto struct {
	ID         string `json:"id" gorm:"column:id;primaryKey"`
	AccidentId string `json:"accident_id" gorm:"column:accident_id"`
	PhotoUrl   string `json:"photo_url" gorm:"column:photo_url"`
	Caption    string `json:"caption" gorm:"column:caption"`
	PhotoOrder int    `json:"photo_order" gorm:"column:photo_order"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`
}
