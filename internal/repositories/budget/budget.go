package repositorybudget

import (
	"fmt"
	domainbudget "safety-riding/internal/domain/budget"
	interfacebudget "safety-riding/internal/interfaces/budget"
	"safety-riding/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewBudgetRepo(db *gorm.DB) interfacebudget.RepoBudgetInterface {
	return &repo{
		DB: db,
	}
}

func (r *repo) Create(budget domainbudget.EventBudget) error {
	return r.DB.Create(&budget).Error
}

func (r *repo) GetByID(id string) (domainbudget.EventBudget, error) {
	var budget domainbudget.EventBudget
	err := r.DB.Preload("Event.School").Where("id = ?", id).First(&budget).Error
	return budget, err
}

func (r *repo) Update(budget domainbudget.EventBudget) error {
	return r.DB.Save(&budget).Error
}

func (r *repo) UpdateById(id string, budget domainbudget.EventBudget) error {
	return r.DB.Model(&domainbudget.EventBudget{}).Where("id = ?", id).Updates(&budget).Error
}

func (r *repo) Fetch(params filter.BaseParams) (ret []domainbudget.EventBudget, totalData int64, err error) {
	query := r.DB.Model(&domainbudget.EventBudget{}).Preload("Event.School").Debug()

	if len(params.Columns) > 0 {
		query = query.Select(params.Columns)
	}

	if params.Search != "" {
		query = query.Where("LOWER(category) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	// apply filters
	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch v := value.(type) {
		case string:
			if v == "" {
				continue
			}
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		}
	}

	if err = query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"budget_date":   true,
			"budget_month":  true,
			"budget_year":   true,
			"budget_amount": true,
			"actual_spent":  true,
			"category":      true,
			"created_at":    true,
			"updated_at":    true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) Delete(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainbudget.EventBudget{}).Error
}

// Aggregation methods
func (r *repo) GetByEventID(eventId string) ([]domainbudget.EventBudget, error) {
	var budgets []domainbudget.EventBudget
	err := r.DB.Preload("Event.School").Where("event_id = ?", eventId).Order("budget_date DESC").Find(&budgets).Error
	return budgets, err
}

func (r *repo) GetByMonthYear(month, year int) ([]domainbudget.EventBudget, error) {
	var budgets []domainbudget.EventBudget
	err := r.DB.Where("budget_month = ? AND budget_year = ?", month, year).
		Order("budget_date DESC").
		Find(&budgets).Error
	return budgets, err
}

func (r *repo) GetSummaryByMonth(month, year int) (domainbudget.BudgetSummary, error) {
	var summary domainbudget.BudgetSummary

	err := r.DB.Model(&domainbudget.EventBudget{}).
		Select(`
			CAST(? AS TEXT) as period,
			COALESCE(SUM(budget_amount), 0) as total_budget,
			COALESCE(SUM(actual_spent), 0) as total_spent,
			COALESCE(SUM(budget_amount - actual_spent), 0) as remaining,
			COUNT(DISTINCT event_id) as event_count
		`, fmt.Sprintf("%d/%d", month, year)).
		Where("budget_month = ? AND budget_year = ?", month, year).
		Scan(&summary).Error

	return summary, err
}

func (r *repo) GetSummaryByYear(year int) ([]domainbudget.BudgetSummary, error) {
	var summaries []domainbudget.BudgetSummary

	err := r.DB.Model(&domainbudget.EventBudget{}).
		Select(`
			budget_month,
			budget_year,
			CONCAT(budget_month, '/', budget_year) as period,
			COALESCE(SUM(budget_amount), 0) as total_budget,
			COALESCE(SUM(actual_spent), 0) as total_spent,
			COALESCE(SUM(budget_amount - actual_spent), 0) as remaining,
			COUNT(DISTINCT event_id) as event_count
		`).
		Where("budget_year = ?", year).
		Group("budget_month, budget_year").
		Order("budget_month ASC").
		Scan(&summaries).Error

	return summaries, err
}

func (r *repo) GetSummaryByEvent(eventId string) (domainbudget.BudgetSummary, error) {
	var summary domainbudget.BudgetSummary

	err := r.DB.Model(&domainbudget.EventBudget{}).
		Select(`
			'Event Total' as period,
			COALESCE(SUM(budget_amount), 0) as total_budget,
			COALESCE(SUM(actual_spent), 0) as total_spent,
			COALESCE(SUM(budget_amount - actual_spent), 0) as remaining,
			1 as event_count
		`).
		Where("event_id = ?", eventId).
		Scan(&summary).Error

	return summary, err
}
