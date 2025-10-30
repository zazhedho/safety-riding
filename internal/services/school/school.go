package serviceschool

import (
	"safety-riding/internal/domain/school"
	"safety-riding/internal/dto"
	interfaceschool "safety-riding/internal/interfaces/school"
	"safety-riding/utils"
	"time"
)

type SchoolService struct {
	SchoolRepo interfaceschool.RepoSchoolInterface
}

func NewSchoolService(schoolRepo interfaceschool.RepoSchoolInterface) *SchoolService {
	return &SchoolService{
		SchoolRepo: schoolRepo,
	}
}

func (s *SchoolService) AddSchool(username string, req dto.AddSchool) (domainschool.School, error) {
	data := domainschool.School{
		ID:           utils.CreateUUID(),
		Name:         req.Name,
		NPSN:         req.NPSN,
		Address:      req.Address,
		Phone:        req.Phone,
		Email:        req.Email,
		DistrictId:   req.DistrictId,
		CityId:       req.CityId,
		ProvinceId:   req.ProvinceId,
		PostalCode:   req.PostalCode,
		Latitude:     req.Latitude,
		Longitude:    req.Longitude,
		StudentCount: req.StudentCount,
		TeacherCount: req.TeacherCount,
		VisitCount:   req.VisitCount,
		IsEducated:   req.IsEducated,
		LastVisitAt:  req.LastVisitAt,
		CreatedAt:    time.Now(),
		CreatedBy:    username,
	}

	if err := s.SchoolRepo.Create(data); err != nil {
		return domainschool.School{}, err
	}

	return data, nil
}
