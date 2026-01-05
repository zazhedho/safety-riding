package domainpolda

import (
	"time"

	"gorm.io/gorm"
)

func (PoldaAccident) TableName() string {
	return "polda_accidents"
}

type PoldaAccident struct {
	ID                string `json:"id" gorm:"column:id;primaryKey"`
	PoliceUnit        string `json:"police_unit" gorm:"column:police_unit"`
	TotalAccidents    int    `json:"total_accidents" gorm:"column:total_accidents"`
	TotalDeaths       int    `json:"total_deaths" gorm:"column:total_deaths"`
	TotalSevereInjury int    `json:"total_severe_injury" gorm:"column:total_severe_injury"`
	TotalMinorInjury  int    `json:"total_minor_injury" gorm:"column:total_minor_injury"`
	Period            string `json:"period" gorm:"column:period"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`
}
