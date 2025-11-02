package repositoryaccident

import (
	"fmt"
	domainaccident "safety-riding/internal/domain/accident"
	interfaceaccident "safety-riding/internal/interfaces/accident"
	"safety-riding/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewAccidentRepo(db *gorm.DB) interfaceaccident.RepoAccidentInterface {
	return &repo{
		DB: db,
	}
}

func (r *repo) Create(accident domainaccident.Accident) error {
	return r.DB.Create(&accident).Error
}

func (r *repo) GetByID(id string) (domainaccident.Accident, error) {
	var accident domainaccident.Accident
	err := r.DB.Where("id = ?", id).First(&accident).Error
	return accident, err
}

func (r *repo) Update(accident domainaccident.Accident) error {
	return r.DB.Save(&accident).Error
}

func (r *repo) Fetch(params filter.BaseParams) (ret []domainaccident.Accident, totalData int64, err error) {
	query := r.DB.Model(&domainaccident.Accident{}).Debug()

	if len(params.Columns) > 0 {
		query = query.Select(params.Columns)
	}

	if params.Search != "" {
		search := "%" + params.Search + "%"
		query = query.Where("LOWER(location) LIKE LOWER(?) OR LOWER(police_report_no) LIKE LOWER(?) OR LOWER(accident_type) LIKE LOWER(?) OR LOWER(vehicle_type) LIKE LOWER(?) OR LOWER(police_station) LIKE LOWER(?)", search, search, search, search, search)
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
			"accident_date":  true,
			"accident_time":  true,
			"location":       true,
			"death_count":    true,
			"injured_count":  true,
			"vehicle_count":  true,
			"accident_type":  true,
			"police_station": true,
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
	return r.DB.Where("id = ?", id).Delete(&domainaccident.Accident{}).Error
}
