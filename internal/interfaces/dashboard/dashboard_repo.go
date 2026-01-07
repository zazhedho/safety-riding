package interfacedashboard

import "safety-riding/internal/dto"

type RepoDashboardInterface interface {
	GetBasicStats() (dto.BasicStats, error)
	GetStats() (*dto.DashboardStats, error)
}
