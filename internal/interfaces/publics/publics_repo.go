package interfacespublic

import (
	domainpublic "safety-riding/internal/domain/publics"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type RepoPublicInterface interface {
	Create(public domainpublic.Public) error
	GetByID(id string) (domainpublic.Public, error)
	Update(public domainpublic.Public) error
	Fetch(params filter.BaseParams) ([]domainpublic.Public, int64, error)
	Delete(id string) error
	GetEducationStats(params filter.BaseParams) ([]map[string]interface{}, error)
	GetSummary() (*dto.PublicSummary, error)
	GetForMap() ([]dto.PublicMapItem, error)
}
