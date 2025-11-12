package interfacespublic

import (
	domainpublic "safety-riding/internal/domain/publics"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServicePublicInterface interface {
	AddPublic(username string, req dto.AddPublic) (domainpublic.Public, error)
	GetPublicById(id string) (domainpublic.Public, error)
	UpdatePublic(id, username string, req dto.UpdatePublic) (domainpublic.Public, error)
	FetchPublic(params filter.BaseParams) ([]domainpublic.Public, int64, error)
	DeletePublic(id, username string) error
	GetEducationStats(params filter.BaseParams) (dto.PublicEducationStatsResponse, error)
}
