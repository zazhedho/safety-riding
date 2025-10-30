package service

import (
	"time"

	"gorm.io/gorm"
)

func (Service) TableName() string {
	return "services"
}

type Service struct {
	Id          string  `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`

	CreatedAt time.Time      `json:"created_at"`
	CreatedBy string         `json:"created_by"`
	UpdatedAt time.Time      `json:"updated_at"`
	UpdatedBy string         `json:"updated_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`
}
