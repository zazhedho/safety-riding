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
	stats, err := s.DashboardRepo.GetStats()
	if err != nil {
		return nil, err
	}

	// Get accident recommendations separately
	recommendations, err := s.DashboardRepo.GetAccidentRecommendations()
	if err != nil {
		// Don't fail the whole request if recommendations fail
		recommendations = []dto.AccidentRecommendation{}
	}
	stats.AccidentRecommendations = recommendations

	return stats, nil
}

func (s *DashboardService) GetAccidentRecommendations() ([]dto.AccidentRecommendation, error) {
	return s.DashboardRepo.GetAccidentRecommendations()
}
