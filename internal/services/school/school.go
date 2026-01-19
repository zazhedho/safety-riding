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
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"student_count": req.StudentCount,
		"teacher_count": req.TeacherCount,
		"major_count":   req.MajorCount,
		"visit_count":   req.VisitCount,
	}); err != nil {
		return domainschool.School{}, err
	}

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
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"student_count": req.StudentCount,
		"teacher_count": req.TeacherCount,
		"major_count":   req.MajorCount,
		"visit_count":   req.VisitCount,
	}); err != nil {
		return domainschool.School{}, err
	}

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

func (s *SchoolService) GetEducationStats(params filter.BaseParams) (dto.SchoolEducationStatsResponse, error) {
	results, err := s.SchoolRepo.GetEducationStats(params)
	if err != nil {
		return dto.SchoolEducationStatsResponse{}, err
	}

	schools := make([]dto.SchoolEducationStats, 0, len(results))
	totalAllStudents := 0
	totalEducatedSchools := 0

	for _, result := range results {
		// Parse total_student_educated (it comes as int64 from database)
		totalStudentEducated := 0
		if val, ok := result["total_student_educated"].(int64); ok {
			totalStudentEducated = int(val)
		} else if val, ok := result["total_student_educated"].(int); ok {
			totalStudentEducated = val
		}

		isEducated := false
		if val, ok := result["is_educated"].(bool); ok {
			isEducated = val
		}

		studentCount := 0
		if val, ok := result["student_count"].(int); ok {
			studentCount = val
		} else if val, ok := result["student_count"].(int32); ok {
			studentCount = int(val)
		} else if val, ok := result["student_count"].(int64); ok {
			studentCount = int(val)
		}

		school := dto.SchoolEducationStats{
			ID:                   result["id"].(string),
			Name:                 result["name"].(string),
			NPSN:                 utils.InterfaceStringStrict(result["npsn"]),
			DistrictId:           utils.InterfaceStringStrict(result["district_id"]),
			DistrictName:         utils.InterfaceStringStrict(result["district_name"]),
			CityId:               utils.InterfaceStringStrict(result["city_id"]),
			CityName:             utils.InterfaceStringStrict(result["city_name"]),
			ProvinceId:           utils.InterfaceStringStrict(result["province_id"]),
			ProvinceName:         utils.InterfaceStringStrict(result["province_name"]),
			StudentCount:         studentCount,
			IsEducated:           isEducated,
			TotalStudentEducated: totalStudentEducated,
		}

		schools = append(schools, school)
		totalAllStudents += totalStudentEducated

		if isEducated {
			totalEducatedSchools++
		}
	}

	response := dto.SchoolEducationStatsResponse{
		Schools:              schools,
		TotalAllStudents:     totalAllStudents,
		TotalSchools:         len(schools),
		TotalEducatedSchools: totalEducatedSchools,
	}

	return response, nil
}

// GetEducationPriority returns the education priority matrix with calculated scores
func (s *SchoolService) GetEducationPriority(params filter.BaseParams) (dto.EducationPriorityResponse, error) {
	const marketThreshold = 87.0 // Market share threshold for mandatory safety riding

	results, err := s.SchoolRepo.GetEducationPriorityData(params)
	if err != nil {
		return dto.EducationPriorityResponse{}, err
	}

	items := make([]dto.EducationPriorityItem, 0, len(results))
	criticalCount := 0
	highPriorityCount := 0
	mediumCount := 0
	lowCount := 0

	for _, result := range results {
		// Parse market share data
		marketShare := utils.InterfaceFloat64(result["market_share"])
		totalSales := utils.InterfaceFloat64(result["total_sales"])
		competitorShare := utils.InterfaceFloat64(result["competitor_share"])

		// Parse school data
		totalSchools := utils.InterfaceInt(result["total_schools"])
		totalStudents := utils.InterfaceInt(result["total_students"])
		educatedSchools := utils.InterfaceInt(result["educated_schools"])
		totalStudentEducated := utils.InterfaceInt(result["total_student_educated"])

		// Parse accident data
		totalAccidents := utils.InterfaceInt(result["total_accidents"])
		totalDeaths := utils.InterfaceInt(result["total_deaths"])
		totalInjured := utils.InterfaceInt(result["total_injured"])
		totalMinorInjured := utils.InterfaceInt(result["total_minor_injured"])

		// Calculate accident severity score (weighted: deaths=10, injured=5, minor=1)
		accidentSeverity := (totalDeaths * 10) + (totalInjured * 5) + (totalMinorInjured * 1)

		// Determine if below threshold
		isBelowThreshold := marketShare < marketThreshold
		safetyRidingStatus := "Optional"
		if isBelowThreshold {
			safetyRidingStatus = "Mandatory"
		}

		// Calculate priority score (0-100)
		priorityScore := calculatePriorityScore(marketShare, marketThreshold, totalStudents, accidentSeverity, totalAccidents)

		// Determine priority level
		priorityLevel := getPriorityLevel(priorityScore)

		// Count by priority level
		switch priorityLevel {
		case "Critical":
			criticalCount++
		case "High":
			highPriorityCount++
		case "Medium":
			mediumCount++
		case "Low":
			lowCount++
		}

		item := dto.EducationPriorityItem{
			ProvinceId:           utils.InterfaceStringStrict(result["province_id"]),
			ProvinceName:         utils.InterfaceStringStrict(result["province_name"]),
			CityId:               utils.InterfaceStringStrict(result["city_id"]),
			CityName:             utils.InterfaceStringStrict(result["city_name"]),
			DistrictId:           utils.InterfaceStringStrict(result["district_id"]),
			DistrictName:         utils.InterfaceStringStrict(result["district_name"]),
			MarketShare:          marketShare,
			TotalSales:           totalSales,
			CompetitorShare:      competitorShare,
			IsBelowThreshold:     isBelowThreshold,
			SafetyRidingStatus:   safetyRidingStatus,
			TotalSchools:         totalSchools,
			TotalStudents:        totalStudents,
			EducatedSchools:      educatedSchools,
			TotalStudentEducated: totalStudentEducated,
			TotalAccidents:       totalAccidents,
			TotalDeaths:          totalDeaths,
			TotalInjured:         totalInjured + totalMinorInjured,
			AccidentSeverity:     accidentSeverity,
			PriorityScore:        priorityScore,
			PriorityLevel:        priorityLevel,
		}

		items = append(items, item)
	}

	response := dto.EducationPriorityResponse{
		Items:             items,
		TotalItems:        len(items),
		CriticalCount:     criticalCount,
		HighPriorityCount: highPriorityCount,
		MediumCount:       mediumCount,
		LowCount:          lowCount,
		MarketThreshold:   marketThreshold,
	}

	return response, nil
}

var _ interfaceschool.ServiceSchoolInterface = (*SchoolService)(nil)

func (s *SchoolService) GetSummary() (*dto.SchoolSummary, error) {
	return s.SchoolRepo.GetSummary()
}

func (s *SchoolService) GetForMap() ([]dto.SchoolMapItem, error) {
	return s.SchoolRepo.GetForMap()
}
