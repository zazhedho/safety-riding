package interfacedashboard

import "safety-riding/internal/dto"

type ServiceDashboardInterface interface {
	GetSummary() (dto.DashboardSummary, error)
	GetStats() (*dto.DashboardStats, error)
}
