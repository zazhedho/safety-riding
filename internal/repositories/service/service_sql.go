package service

import (
	"fmt"
	"workshop-management/internal/domain/service"
	"workshop-management/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewServiceRepo(db *gorm.DB) service.RepoService {
	return &repo{DB: db}
}

func (r *repo) Store(m service.Service) error {
	return r.DB.Create(&m).Error
}

func (r *repo) Fetch(params filter.BaseParams) (ret []service.Service, totalData int64, err error) {
	query := r.DB.Model(&service.Service{}).Debug()

	if len(params.Columns) > 0 {
		query = query.Select(params.Columns)
	}

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)", searchPattern, searchPattern)
	}

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
			"name":       true,
			"price":      true,
			"created_at": true,
			"updated_at": true,
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

func (r *repo) GetById(id string) (service.Service, error) {
	var m service.Service
	if err := r.DB.Where("id = ?", id).First(&m).Error; err != nil {
		return service.Service{}, err
	}
	return m, nil
}

func (r *repo) Update(m service.Service, data interface{}) (int64, error) {
	res := r.DB.Table(m.TableName()).Where("id = ?", m.Id).Updates(data)
	if res.Error != nil {
		return 0, nil
	}
	return res.RowsAffected, nil
}

func (r *repo) Delete(m service.Service, data interface{}) error {
	return r.DB.Model(&m).Where("id = ?", m.Id).Updates(data).Error
}
