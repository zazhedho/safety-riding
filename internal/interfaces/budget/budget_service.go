package interfacebudget

import (
	domainbudget "safety-riding/internal/domain/budget"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceBudgetInterface interface {
	AddBudget(username string, req dto.AddEventBudget) (domainbudget.EventBudget, error)
	GetBudgetById(id string) (domainbudget.EventBudget, error)
	UpdateBudget(id, username, role string, req dto.UpdateEventBudget) (domainbudget.EventBudget, error)
	FetchBudget(params filter.BaseParams) ([]domainbudget.EventBudget, int64, error)
	DeleteBudget(id, username string) error
	GetBudgetsByEvent(eventId string) ([]domainbudget.EventBudget, error)
	GetBudgetsByMonthYear(month, year int) ([]domainbudget.EventBudget, error)
	GetMonthlySummary(month, year int) (domainbudget.BudgetSummary, error)
	GetYearlySummary(year int) ([]domainbudget.BudgetSummary, error)
	GetEventSummary(eventId string) (domainbudget.BudgetSummary, error)
}
