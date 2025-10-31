package domainbudget

import (
	"time"

	"gorm.io/gorm"
)

type EventBudget struct {
	ID           string  `json:"id" gorm:"column:id;primaryKey"`
	EventId      string  `json:"event_id" gorm:"column:event_id"`
	Category     string  `json:"category" gorm:"column:category"`
	Description  string  `json:"description" gorm:"column:description"`
	BudgetAmount float64 `json:"budget_amount" gorm:"column:budget_amount"`
	ActualSpent  float64 `json:"actual_spent" gorm:"column:actual_spent"`
	BudgetDate   string  `json:"budget_date" gorm:"column:budget_date"`
	BudgetMonth  int     `json:"budget_month" gorm:"column:budget_month"`
	BudgetYear   int     `json:"budget_year" gorm:"column:budget_year"`
	Status       string  `json:"status" gorm:"column:status"`
	Notes        string  `json:"notes" gorm:"column:notes"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-"`
	DeletedBy string         `json:"-"`
}

type BudgetSummary struct {
	Period      string  `json:"period"`
	TotalBudget float64 `json:"total_budget"`
	TotalSpent  float64 `json:"total_spent"`
	Remaining   float64 `json:"remaining"`
	EventCount  int     `json:"event_count"`
}
