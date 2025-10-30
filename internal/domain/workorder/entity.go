package workorder

import (
	"time"
	"workshop-management/internal/domain/user"
	"workshop-management/internal/domain/vehicle"

	"gorm.io/gorm"
)

func (WorkOrder) TableName() string {
	return "work_orders"
}

func (SvcWorkOrder) TableName() string {
	return "work_order_services"
}

func (PartWorkOrder) TableName() string {
	return "work_order_parts"
}

type WorkOrder struct {
	Id         string  `json:"id" gorm:"type:uuid;primaryKey"`
	BookingId  string  `json:"booking_id" gorm:"type:uuid;not null"`
	CustomerId string  `json:"customer_id" gorm:"type:uuid;not null"`
	VehicleId  string  `json:"vehicle_id" gorm:"type:uuid;not null"`
	MechanicId *string `json:"mechanic_id"`
	Status     string  `json:"status"` // pending, in_progress, completed
	Notes      string  `json:"notes"`

	CreatedAt time.Time      `json:"created_at"`
	CreatedBy string         `json:"created_by"`
	UpdatedAt time.Time      `json:"updated_at"`
	UpdatedBy string         `json:"updated_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`

	User     user.Users      `gorm:"foreignKey:CustomerId;references:id"`
	Vehicle  vehicle.Vehicle `gorm:"foreignKey:VehicleId"`
	Services []SvcWorkOrder  `gorm:"foreignKey:WorkOrderId"`
	Parts    []PartWorkOrder `gorm:"foreignKey:WorkOrderId"`
}

type PartWorkOrder struct {
	Id          string    `json:"id"`
	WorkOrderId string    `json:"work_order_id"`
	SparepartId string    `json:"sparepart_id"`
	Quantity    int       `json:"quantity"`
	Price       float64   `json:"price"`
	CreatedAt   time.Time `json:"created_at"`
}

type SvcWorkOrder struct {
	Id          string  `json:"id"`
	WorkOrderId string  `json:"work_order_id"`
	ServiceId   string  `json:"service_id"`
	ServiceName string  `json:"service_name"`
	Price       float64 `json:"price"`
	Quantity    int     `json:"quantity"`
	Status      string  `json:"status"`

	CreatedAt time.Time `json:"created_at"`
	CreatedBy string    `json:"created_by"`
	UpdatedAt time.Time `json:"updated_at"`
	UpdatedBy string    `json:"updated_by"`
	DeletedAt time.Time `json:"-"`
	DeletedBy string    `json:"-"`
}
