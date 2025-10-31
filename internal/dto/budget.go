package dto

type AddEventBudget struct {
	EventId      string  `json:"event_id" binding:"required"`
	Category     string  `json:"category" binding:"required"`
	Description  string  `json:"description,omitempty"`
	BudgetAmount float64 `json:"budget_amount" binding:"required,gt=0"`
	ActualSpent  float64 `json:"actual_spent,omitempty"`
	BudgetDate   string  `json:"budget_date" binding:"required"`
	Status       string  `json:"status,omitempty"`
	Notes        string  `json:"notes,omitempty"`
}

type UpdateEventBudget struct {
	Category     string  `json:"category,omitempty"`
	Description  string  `json:"description,omitempty"`
	BudgetAmount float64 `json:"budget_amount,omitempty"`
	ActualSpent  float64 `json:"actual_spent,omitempty"`
	BudgetDate   string  `json:"budget_date,omitempty"`
	Status       string  `json:"status,omitempty"`
	Notes        string  `json:"notes,omitempty"`
}
