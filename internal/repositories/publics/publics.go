package repositorypublic

import (
	"fmt"
	domainpublic "safety-riding/internal/domain/publics"
	"safety-riding/internal/dto"
	interfacespublic "safety-riding/internal/interfaces/publics"
	"safety-riding/pkg/filter"
	"strconv"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewPublicRepo(db *gorm.DB) interfacespublic.RepoPublicInterface {
	return &repo{
		DB: db,
	}
}

func (r *repo) Create(public domainpublic.Public) error {
	return r.DB.Create(&public).Error
}

func (r *repo) GetByID(id string) (domainpublic.Public, error) {
	var public domainpublic.Public
	err := r.DB.Where("id = ?", id).First(&public).Error
	return public, err
}

func (r *repo) Update(public domainpublic.Public) error {
	return r.DB.Save(&public).Error
}

func (r *repo) Fetch(params filter.BaseParams) (ret []domainpublic.Public, totalData int64, err error) {
	query := r.DB.Model(&domainpublic.Public{}).Debug()

	if len(params.Columns) > 0 {
		query = query.Select(params.Columns)
	}

	if params.Search != "" {
		query = query.Where("LOWER(name) LIKE LOWER(?)", "%"+params.Search+"%")
	}

	// apply filters
	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch v := value.(type) {
		case string:
			if v == "" {
				continue
			}
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		}
	}

	if err = query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"name":           true,
			"category":       true,
			"phone":          true,
			"employee_count": true,
			"visit_count":    true,
			"created_at":     true,
			"updated_at":     true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) Delete(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainpublic.Public{}).Error
}

func (r *repo) GetEducationStats(params filter.BaseParams) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := r.DB.Table("publics").
		Select(`
			publics.id,
			publics.name,
			publics.category,
			publics.district_id,
			publics.district_name,
			publics.city_id,
			publics.city_name,
			publics.province_id,
			publics.province_name,
			publics.employee_count,
			publics.is_educated,
			COALESCE(SUM(CASE WHEN publics.is_educated = TRUE then events.attendees_count ELSE 0 END), 0) as total_employee_educated
		`).
		Joins("LEFT JOIN events ON publics.id = events.public_id AND events.deleted_at IS NULL").
		Where("publics.deleted_at IS NULL").
		Group("publics.id, publics.name, publics.category, publics.district_id, publics.district_name, publics.city_id, publics.city_name, publics.province_id, publics.province_name, publics.employee_count, publics.is_educated")

	if monthVal, ok := params.Filters["month"]; ok {
		monthStr := fmt.Sprintf("%v", monthVal)
		if monthInt, err := strconv.Atoi(monthStr); err == nil && monthInt >= 1 && monthInt <= 12 {
			query = query.Where("EXTRACT(MONTH FROM events.event_date::date) = ?", monthInt)
		}
		delete(params.Filters, "month")
	}

	if yearVal, ok := params.Filters["year"]; ok {
		yearStr := fmt.Sprintf("%v", yearVal)
		if yearInt, err := strconv.Atoi(yearStr); err == nil {
			query = query.Where("EXTRACT(YEAR FROM events.event_date::date) = ?", yearInt)
		}
		delete(params.Filters, "year")
	}

	// Apply search filter
	if params.Search != "" {
		query = query.Where("LOWER(publics.name) LIKE LOWER(?)", "%"+params.Search+"%")
	}

	// Apply filters
	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch v := value.(type) {
		case string:
			if v == "" {
				continue
			}
			query = query.Where(fmt.Sprintf("publics.%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("publics.%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("publics.%s = ?", key), v)
		}
	}

	// Apply ordering
	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"name":                    true,
			"category":                true,
			"employee_count":          true,
			"is_educated":             true,
			"total_employee_educated": true,
		}

		if _, ok := validColumns[params.OrderBy]; ok {
			if params.OrderBy == "total_employee_educated" {
				query = query.Order(fmt.Sprintf("total_employee_educated %s", params.OrderDirection))
			} else {
				query = query.Order(fmt.Sprintf("publics.%s %s", params.OrderBy, params.OrderDirection))
			}
		}
	} else {
		query = query.Order("publics.name ASC")
	}

	// Apply pagination
	if params.Limit > 0 {
		query = query.Offset(params.Offset).Limit(params.Limit)
	}

	err := query.Scan(&results).Error
	return results, err
}

func (r *repo) GetSummary() (*dto.PublicSummary, error) {
	var result dto.PublicSummary
	err := r.DB.Model(&domainpublic.Public{}).
		Select("COUNT(*) as total_publics, COALESCE(SUM(employee_count), 0) as total_employees").
		Where("deleted_at IS NULL").
		Scan(&result).Error
	return &result, err
}

func (r *repo) GetForMap() ([]dto.PublicMapItem, error) {
	var results []dto.PublicMapItem
	err := r.DB.Model(&domainpublic.Public{}).
		Select("id, name, category, address, phone, latitude, longitude").
		Where("deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL").
		Scan(&results).Error
	return results, err
}
