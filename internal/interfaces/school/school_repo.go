package interfaceschool

import (
	domainschool "safety-riding/internal/domain/school"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type RepoSchoolInterface interface {
	Create(school domainschool.School) error
	GetByID(id string) (domainschool.School, error)
	Update(school domainschool.School) error
	Fetch(params filter.BaseParams) ([]domainschool.School, int64, error)
	Delete(id string) error
	GetEducationStats(params filter.BaseParams) ([]map[string]interface{}, error)
	GetEducationPriorityData(params filter.BaseParams) ([]map[string]interface{}, error)
	GetSummary() (*dto.SchoolSummary, error)
	GetForMap() ([]dto.SchoolMapItem, error)
}
