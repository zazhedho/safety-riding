package serviceschool

import (
	"safety-riding/internal/domain/school"
	"safety-riding/internal/dto"
	interfaceschool "safety-riding/internal/interfaces/school"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"strings"
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
	phone := utils.NormalizePhoneTo62(req.Phone)
	data := domainschool.School{
		ID:           utils.CreateUUID(),
		Name:         strings.ToUpper(req.Name),
		NPSN:         req.NPSN,
		Address:      req.Address,
		Phone:        phone,
		Email:        req.Email,
		DistrictId:   req.DistrictId,
		DistrictName: req.DistrictName,
		CityId:       req.CityId,
		CityName:     req.CityName,
		ProvinceId:   req.ProvinceId,
		ProvinceName: req.ProvinceName,
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

func (s *SchoolService) GetSchoolById(id string) (domainschool.School, error) {
	return s.SchoolRepo.GetByID(id)
}

func (s *SchoolService) UpdateSchool(id, username string, req dto.UpdateSchool) (domainschool.School, error) {
	// Get existing school
	school, err := s.SchoolRepo.GetByID(id)
	if err != nil {
		return domainschool.School{}, err
	}

	// Update fields if provided
	if req.Name != "" {
		school.Name = strings.ToUpper(req.Name)
	}
	if req.NPSN != "" {
		school.NPSN = req.NPSN
	}
	if req.Address != "" {
		school.Address = req.Address
	}
	if req.Phone != "" {
		phone := utils.NormalizePhoneTo62(req.Phone)
		school.Phone = phone
	}
	if req.Email != "" {
		school.Email = req.Email
	}
	if req.DistrictId != "" {
		school.DistrictId = req.DistrictId
	}
	if req.DistrictName != "" {
		school.DistrictName = req.DistrictName
	}
	if req.CityId != "" {
		school.CityId = req.CityId
	}
	if req.CityName != "" {
		school.CityName = req.CityName
	}
	if req.ProvinceId != "" {
		school.ProvinceId = req.ProvinceId
	}
	if req.ProvinceName != "" {
		school.ProvinceName = req.ProvinceName
	}
	if req.PostalCode != "" {
		school.PostalCode = req.PostalCode
	}
	if req.Latitude != 0 {
		school.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		school.Longitude = req.Longitude
	}
	if req.StudentCount != 0 {
		school.StudentCount = req.StudentCount
	}
	if req.TeacherCount != 0 {
		school.TeacherCount = req.TeacherCount
	}
	if req.VisitCount != 0 {
		school.VisitCount = req.VisitCount
	}
	school.IsEducated = req.IsEducated
	if req.LastVisitAt != nil {
		school.LastVisitAt = req.LastVisitAt
	}

	school.UpdatedAt = time.Now()
	school.UpdatedBy = username

	if err := s.SchoolRepo.Update(school); err != nil {
		return domainschool.School{}, err
	}

	return school, nil
}

func (s *SchoolService) FetchSchool(params filter.BaseParams) ([]domainschool.School, int64, error) {
	return s.SchoolRepo.Fetch(params)
}

func (s *SchoolService) DeleteSchool(id, username string) error {
	// Check if school exists
	school, err := s.SchoolRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Update deleted fields
	school.DeletedBy = username

	// Soft delete
	if err := s.SchoolRepo.Delete(id); err != nil {
		return err
	}

	return nil
}
