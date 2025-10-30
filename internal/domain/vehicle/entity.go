package vehicle

import (
	"time"
	"workshop-management/internal/domain/user"

	"gorm.io/gorm"
)

func (Vehicle) TableName() string {
	return "vehicles"
}

type Vehicle struct {
	Id           string         `json:"id" gorm:"column:id;primaryKey"`
	UserId       string         `json:"user_id,omitempty"`
	LicensePlate string         `json:"license_plate,omitempty"`
	Brand        string         `json:"brand,omitempty"`
	Model        string         `json:"model,omitempty"`
	Year         string         `json:"year,omitempty"`
	Color        string         `json:"color,omitempty"`
	CreatedAt    time.Time      `json:"created_at,omitempty"`
	UpdatedAt    time.Time      `json:"updated_at,omitempty"`
	UpdatedBy    string         `json:"updated_by,omitempty"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	DeletedBy    string         `json:"-"`

	User user.Users `gorm:"foreignKey:UserId"`
}
