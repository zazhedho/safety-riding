package servicebudget

import (
	"fmt"
	"safety-riding/internal/domain/budget"
	"safety-riding/internal/dto"
	interfacebudget "safety-riding/internal/interfaces/budget"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"strconv"
	"strings"
	"time"
)

type BudgetService struct {
	BudgetRepo interfacebudget.RepoBudgetInterface
}

func NewBudgetService(budgetRepo interfacebudget.RepoBudgetInterface) *BudgetService {
	return &BudgetService{
		BudgetRepo: budgetRepo,
	}
}

func parseDateToMonthYear(dateStr string) (int, int, error) {
	// Expected format: YYYY-MM-DD
	parts := strings.Split(dateStr, "-")
	if len(parts) < 2 {
		return 0, 0, fmt.Errorf("invalid date format, expected YYYY-MM-DD")
	}

	year, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid year: %w", err)
	}

	month, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid month: %w", err)
	}

	if month < 1 || month > 12 {
		return 0, 0, fmt.Errorf("month must be between 1 and 12")
	}

	return month, year, nil
}

func (s *BudgetService) AddBudget(username string, req dto.AddEventBudget) (domainbudget.EventBudget, error) {
	month, year, err := parseDateToMonthYear(req.BudgetDate)
	if err != nil {
		return domainbudget.EventBudget{}, err
	}

	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"budget_amount": req.BudgetAmount,
		"actual_spent":  req.ActualSpent,
	}); err != nil {
		return domainbudget.EventBudget{}, err
	}

	data := domainbudget.EventBudget{
		ID:           utils.CreateUUID(),
		EventId:      req.EventId,
		Category:     utils.TitleCase(req.Category),
		Description:  req.Description,
		BudgetAmount: req.BudgetAmount,
		ActualSpent:  req.ActualSpent,
		BudgetDate:   req.BudgetDate,
		BudgetMonth:  month,
		BudgetYear:   year,
		Status:       req.Status,
		Notes:        req.Notes,
		CreatedAt:    time.Now(),
		CreatedBy:    username,
	}

	if err := s.BudgetRepo.Create(data); err != nil {
		return domainbudget.EventBudget{}, err
	}

	return data, nil
}

func (s *BudgetService) GetBudgetById(id string) (domainbudget.EventBudget, error) {
	return s.BudgetRepo.GetByID(id)
}

func (s *BudgetService) UpdateBudget(id, username, role string, req dto.UpdateEventBudget) (domainbudget.EventBudget, error) {
	// Get existing budget
	budget, err := s.BudgetRepo.GetByID(id)
	if err != nil {
		return domainbudget.EventBudget{}, err
	}

	// Prevent update if budget status is final (Completed or Cancelled)
	// Exception: admin role can bypass this validation
	isFinalized := strings.EqualFold(budget.Status, utils.StsCompleted) || strings.EqualFold(budget.Status, utils.StsCancelled)
	isAdmin := strings.EqualFold(role, utils.RoleAdmin)

	if isFinalized && !isAdmin {
		return domainbudget.EventBudget{}, fmt.Errorf("cannot update budget with status '%s'. Budget is already finalized", budget.Status)
	}

	// Update fields if provided
	if req.EventId != "" {
		budget.EventId = req.EventId
	}
	if req.Category != "" {
		budget.Category = req.Category
	}
	if req.Description != "" {
		budget.Description = req.Description
	}
	if req.BudgetAmount != 0 {
		budget.BudgetAmount = req.BudgetAmount
	}
	if req.ActualSpent != 0 {
		budget.ActualSpent = req.ActualSpent
	}
	if req.BudgetDate != "" {
		month, year, err := parseDateToMonthYear(req.BudgetDate)
		if err != nil {
			return domainbudget.EventBudget{}, err
		}
		budget.BudgetDate = req.BudgetDate
		budget.BudgetMonth = month
		budget.BudgetYear = year
	}
	if req.Status != "" {
		budget.Status = req.Status
	}
	if req.Notes != "" {
		budget.Notes = req.Notes
	}

	budget.UpdatedAt = time.Now()
	budget.UpdatedBy = username

	if err := s.BudgetRepo.UpdateById(id, budget); err != nil {
		return domainbudget.EventBudget{}, err
	}

	return budget, nil
}

func (s *BudgetService) FetchBudget(params filter.BaseParams) ([]domainbudget.EventBudget, int64, error) {
	return s.BudgetRepo.Fetch(params)
}

func (s *BudgetService) DeleteBudget(id, username string) error {
	// Check if budget exists
	budget, err := s.BudgetRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Update deleted fields
	budget.DeletedBy = username

	// Soft delete
	if err := s.BudgetRepo.Delete(id); err != nil {
		return err
	}

	return nil
}

// Aggregation methods
func (s *BudgetService) GetBudgetsByEvent(eventId string) ([]domainbudget.EventBudget, error) {
	return s.BudgetRepo.GetByEventID(eventId)
}

func (s *BudgetService) GetBudgetsByMonthYear(month, year int) ([]domainbudget.EventBudget, error) {
	return s.BudgetRepo.GetByMonthYear(month, year)
}

func (s *BudgetService) GetMonthlySummary(month, year int) (domainbudget.BudgetSummary, error) {
	return s.BudgetRepo.GetSummaryByMonth(month, year)
}

func (s *BudgetService) GetYearlySummary(year int) ([]domainbudget.BudgetSummary, error) {
	return s.BudgetRepo.GetSummaryByYear(year)
}

func (s *BudgetService) GetEventSummary(eventId string) (domainbudget.BudgetSummary, error) {
	return s.BudgetRepo.GetSummaryByEvent(eventId)
}
