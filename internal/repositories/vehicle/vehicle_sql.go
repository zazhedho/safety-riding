package repository

import (
	"fmt"
	"workshop-management/internal/domain/vehicle"
	"workshop-management/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewVehicleRepo(db *gorm.DB) vehicle.RepoVehicle {
	return &repo{DB: db}
}

func (r *repo) Store(m vehicle.Vehicle) error {
	return r.DB.Create(&m).Error
}

func (r *repo) Fetch(params filter.BaseParams) (ret []vehicle.Vehicle, totalData int64, err error) {
	query := r.DB.Model(&vehicle.Vehicle{}).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name")
		}).Debug()

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("LOWER(license_plate) LIKE LOWER(?) OR LOWER(brand) LIKE LOWER(?) OR LOWER(model) LIKE LOWER(?) OR year LIKE ? OR LOWER(color) LIKE LOWER(?)", searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
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

	if err := query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"license_plate": true,
			"brand":         true,
			"model":         true,
			"year":          true,
			"created_at":    true,
			"updated_at":    true,
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

func (r *repo) GetById(id string) (vehicle.Vehicle, error) {
	var m vehicle.Vehicle
	if err := r.DB.Where("id = ?", id).First(&m).Error; err != nil {
		return m, err
	}
	return m, nil
}

func (r *repo) Update(m vehicle.Vehicle, data interface{}) (int64, error) {
	res := r.DB.Table(m.TableName()).Where("id = ?", m.Id).Updates(data)
	if res.Error != nil {
		return 0, res.Error
	}

	return res.RowsAffected, nil
}

func (r *repo) Delete(m vehicle.Vehicle, data interface{}) error {
	return r.DB.Table(m.TableName()).Where("id = ?", m.Id).Updates(data).Error
}
