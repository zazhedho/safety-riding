package interfacebudget

import (
	domainbudget "safety-riding/internal/domain/budget"
	"safety-riding/pkg/filter"
)

type RepoBudgetInterface interface {
	Create(budget domainbudget.EventBudget) error
	GetByID(id string) (domainbudget.EventBudget, error)
	Update(budget domainbudget.EventBudget) error
	UpdateById(id string, budget domainbudget.EventBudget) error
	Fetch(params filter.BaseParams) ([]domainbudget.EventBudget, int64, error)
	Delete(id string) error

	// Aggregation methods
	GetByEventID(eventId string) ([]domainbudget.EventBudget, error)
	GetByMonthYear(month, year int) ([]domainbudget.EventBudget, error)
	GetSummaryByMonth(month, year int) (domainbudget.BudgetSummary, error)
	GetSummaryByYear(year int) ([]domainbudget.BudgetSummary, error)
	GetSummaryByEvent(eventId string) (domainbudget.BudgetSummary, error)
}
