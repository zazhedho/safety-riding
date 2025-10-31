package domainevent

import (
	"time"

	"gorm.io/gorm"
)

type Event struct {
	ID              string `json:"id" gorm:"column:id;primaryKey"`
	SchoolId        string `json:"school_id" gorm:"column:school_id"`
	Title           string `json:"title" gorm:"column:title"`
	Description     string `json:"description" gorm:"column:description"`
	EventDate       string `json:"event_date" gorm:"column:event_date"`
	StartTime       string `json:"start_time" gorm:"column:start_time"`
	EndTime         string `json:"end_time" gorm:"column:end_time"`
	Location        string `json:"location" gorm:"column:location"`
	DistrictId      string `json:"district_id" gorm:"column:district_id"`
	CityId          string `json:"city_id" gorm:"column:city_id"`
	ProvinceId      string `json:"province_id" gorm:"column:province_id"`
	EventType       string `json:"event_type" gorm:"column:event_type"`
	TargetAudience  string `json:"target_audience" gorm:"column:target_audience"`
	AttendeesCount  int    `json:"attendees_count" gorm:"column:attendees_count"`
	InstructorName  string `json:"instructor_name" gorm:"column:instructor_name"`
	InstructorPhone string `json:"instructor_phone" gorm:"column:instructor_phone"`
	Status          string `json:"status" gorm:"column:status"`
	Notes           string `json:"notes" gorm:"column:notes"`

	Photos []EventPhoto `json:"photos,omitempty" gorm:"foreignKey:EventId;constraint:OnDelete:CASCADE"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`
}

type EventPhoto struct {
	ID         string `json:"id" gorm:"column:id;primaryKey"`
	EventId    string `json:"event_id" gorm:"column:event_id"`
	PhotoUrl   string `json:"photo_url" gorm:"column:photo_url"`
	Caption    string `json:"caption" gorm:"column:caption"`
	PhotoOrder int    `json:"photo_order" gorm:"column:photo_order"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`
}
