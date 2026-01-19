package servicepublic

import (
	domainpublic "safety-riding/internal/domain/publics"
	"safety-riding/internal/dto"
	interfacespublic "safety-riding/internal/interfaces/publics"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"strings"
	"time"
)

type PublicService struct {
	PublicRepo interfacespublic.RepoPublicInterface
}

func NewPublicService(publicRepo interfacespublic.RepoPublicInterface) *PublicService {
	return &PublicService{
		PublicRepo: publicRepo,
	}
}

func (s *PublicService) AddPublic(username string, req dto.AddPublic) (domainpublic.Public, error) {
	phone := ""
	if req.Phone != "" {
		phone = utils.NormalizePhoneTo62(req.Phone)
	}

	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"employee_count": req.EmployeeCount,
		"visit_count":    req.VisitCount,
	}); err != nil {
		return domainpublic.Public{}, err
	}

	data := domainpublic.Public{
		ID:            utils.CreateUUID(),
		Name:          strings.ToUpper(req.Name),
		Category:      req.Category,
		Address:       req.Address,
		Phone:         phone,
		Email:         req.Email,
		DistrictId:    req.DistrictId,
		DistrictName:  req.DistrictName,
		CityId:        req.CityId,
		CityName:      req.CityName,
		ProvinceId:    req.ProvinceId,
		ProvinceName:  req.ProvinceName,
		PostalCode:    req.PostalCode,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		EmployeeCount: req.EmployeeCount,
		VisitCount:    req.VisitCount,
		IsEducated:    req.IsEducated,
		LastVisitAt:   req.LastVisitAt,
		CreatedAt:     time.Now(),
		CreatedBy:     username,
	}

	if err := s.PublicRepo.Create(data); err != nil {
		return domainpublic.Public{}, err
	}

	return data, nil
}

func (s *PublicService) GetPublicById(id string) (domainpublic.Public, error) {
	return s.PublicRepo.GetByID(id)
}

func (s *PublicService) UpdatePublic(id, username string, req dto.UpdatePublic) (domainpublic.Public, error) {
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"employee_count": req.EmployeeCount,
		"visit_count":    req.VisitCount,
	}); err != nil {
		return domainpublic.Public{}, err
	}

	// Get existing public entity
	public, err := s.PublicRepo.GetByID(id)
	if err != nil {
		return domainpublic.Public{}, err
	}

	// Update fields if provided
	if req.Name != "" {
		public.Name = strings.ToUpper(req.Name)
	}
	if req.Category != "" {
		public.Category = req.Category
	}
	if req.Address != "" {
		public.Address = req.Address
	}
	if req.Phone != "" {
		phone := utils.NormalizePhoneTo62(req.Phone)
		public.Phone = phone
	}
	if req.Email != "" {
		public.Email = req.Email
	}
	if req.DistrictId != "" {
		public.DistrictId = req.DistrictId
	}
	if req.DistrictName != "" {
		public.DistrictName = req.DistrictName
	}
	if req.CityId != "" {
		public.CityId = req.CityId
	}
	if req.CityName != "" {
		public.CityName = req.CityName
	}
	if req.ProvinceId != "" {
		public.ProvinceId = req.ProvinceId
	}
	if req.ProvinceName != "" {
		public.ProvinceName = req.ProvinceName
	}
	if req.PostalCode != "" {
		public.PostalCode = req.PostalCode
	}
	if req.Latitude != 0 {
		public.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		public.Longitude = req.Longitude
	}
	if req.EmployeeCount != 0 {
		public.EmployeeCount = req.EmployeeCount
	}
	if req.VisitCount != 0 {
		public.VisitCount = req.VisitCount
	}
	public.IsEducated = req.IsEducated
	if req.LastVisitAt != nil {
		public.LastVisitAt = req.LastVisitAt
	}

	public.UpdatedAt = time.Now()
	public.UpdatedBy = username

	if err := s.PublicRepo.Update(public); err != nil {
		return domainpublic.Public{}, err
	}

	return public, nil
}

func (s *PublicService) FetchPublic(params filter.BaseParams) ([]domainpublic.Public, int64, error) {
	return s.PublicRepo.Fetch(params)
}

func (s *PublicService) DeletePublic(id, username string) error {
	// Check if public entity exists
	public, err := s.PublicRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Update deleted fields
	public.DeletedBy = username

	// Soft delete
	if err := s.PublicRepo.Delete(id); err != nil {
		return err
	}

	return nil
}

func (s *PublicService) GetEducationStats(params filter.BaseParams) (dto.PublicEducationStatsResponse, error) {
	results, err := s.PublicRepo.GetEducationStats(params)
	if err != nil {
		return dto.PublicEducationStatsResponse{}, err
	}

	publics := make([]dto.PublicEducationStats, 0, len(results))
	totalAllEmployees := 0
	totalEducatedPublics := 0

	for _, result := range results {
		// Parse total_employee_educated (it comes as int64 from database)
		totalEmployeeEducated := 0
		if val, ok := result["total_employee_educated"].(int64); ok {
			totalEmployeeEducated = int(val)
		} else if val, ok := result["total_employee_educated"].(int); ok {
			totalEmployeeEducated = val
		}

		isEducated := false
		if val, ok := result["is_educated"].(bool); ok {
			isEducated = val
		}

		employeeCount := 0
		if val, ok := result["employee_count"].(int); ok {
			employeeCount = val
		} else if val, ok := result["employee_count"].(int32); ok {
			employeeCount = int(val)
		} else if val, ok := result["employee_count"].(int64); ok {
			employeeCount = int(val)
		}

		public := dto.PublicEducationStats{
			ID:                    result["id"].(string),
			Name:                  result["name"].(string),
			Category:              utils.InterfaceStringStrict(result["category"]),
			DistrictId:            utils.InterfaceStringStrict(result["district_id"]),
			DistrictName:          utils.InterfaceStringStrict(result["district_name"]),
			CityId:                utils.InterfaceStringStrict(result["city_id"]),
			CityName:              utils.InterfaceStringStrict(result["city_name"]),
			ProvinceId:            utils.InterfaceStringStrict(result["province_id"]),
			ProvinceName:          utils.InterfaceStringStrict(result["province_name"]),
			EmployeeCount:         employeeCount,
			IsEducated:            isEducated,
			TotalEmployeeEducated: totalEmployeeEducated,
		}

		publics = append(publics, public)
		totalAllEmployees += totalEmployeeEducated

		if isEducated {
			totalEducatedPublics++
		}
	}

	response := dto.PublicEducationStatsResponse{
		Publics:              publics,
		TotalAllEmployees:    totalAllEmployees,
		TotalPublics:         len(publics),
		TotalEducatedPublics: totalEducatedPublics,
	}

	return response, nil
}

var _ interfacespublic.ServicePublicInterface = (*PublicService)(nil)

func (s *PublicService) GetSummary() (*dto.PublicSummary, error) {
	return s.PublicRepo.GetSummary()
}

func (s *PublicService) GetForMap() ([]dto.PublicMapItem, error) {
	return s.PublicRepo.GetForMap()
}
