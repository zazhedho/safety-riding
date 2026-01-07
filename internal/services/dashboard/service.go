package servicedashboard

import (
	"safety-riding/internal/dto"
	interfacedashboard "safety-riding/internal/interfaces/dashboard"
)

type DashboardService struct {
	DashboardRepo interfacedashboard.RepoDashboardInterface
}

func NewDashboardService(dashboardRepo interfacedashboard.RepoDashboardInterface) interfacedashboard.ServiceDashboardInterface {
	return &DashboardService{DashboardRepo: dashboardRepo}
}

func (s *DashboardService) GetSummary() (dto.DashboardSummary, error) {
	// Implement existing GetSummary if needed
	return dto.DashboardSummary{}, nil
}

func (s *DashboardService) GetStats() (*dto.DashboardStats, error) {
	return s.DashboardRepo.GetStats()
}
