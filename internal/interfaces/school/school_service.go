package interfaceschool

import (
	domainschool "safety-riding/internal/domain/school"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceSchoolInterface interface {
	AddSchool(username string, req dto.AddSchool) (domainschool.School, error)
	GetSchoolById(id string) (domainschool.School, error)
	UpdateSchool(id, username string, req dto.UpdateSchool) (domainschool.School, error)
	FetchSchool(params filter.BaseParams) ([]domainschool.School, int64, error)
	DeleteSchool(id, username string) error
	GetEducationStats(params filter.BaseParams) (dto.SchoolEducationStatsResponse, error)
	GetEducationPriority(params filter.BaseParams) (dto.EducationPriorityResponse, error)
}
