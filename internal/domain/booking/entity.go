package booking

import (
	"time"
	"workshop-management/internal/domain/service"
	"workshop-management/internal/domain/vehicle"

	"gorm.io/gorm"
)

func (b *Booking) TableName() string {
	return "bookings"
}

// Booking entity
type Booking struct {
	Id          string    `json:"id"`
	UserId      string    `json:"user_id"`
	VehicleId   string    `json:"vehicle_id"`
	Notes       string    `json:"notes"`
	Status      string    `json:"status"` // pending, confirmed, cancelled
	BookingDate time.Time `json:"booking_date"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	UpdatedBy string         `json:"updated_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`

	Services []service.Service `json:"services,omitempty" gorm:"many2many:booking_services;"`
	Vehicle  vehicle.Vehicle   `gorm:"foreignKey:VehicleId"`
}

// BookService entity (join table)
type BookService struct {
	Id        string `json:"id"`
	BookingID string `json:"booking_id"`
	ServiceID string `json:"service_id"`
}

func (bs *BookService) TableName() string {
	return "booking_services"
}
