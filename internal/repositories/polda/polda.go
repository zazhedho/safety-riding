package repositorypolda

import (
	"fmt"
	domainpolda "safety-riding/internal/domain/polda"
	interfacepolda "safety-riding/internal/interfaces/polda"
	"safety-riding/pkg/filter"

	"gorm.io/gorm"
)

type PoldaAccidentRepository = interfacepolda.RepositoryPoldaInterface

type poldaAccidentRepo struct {
	db *gorm.DB
}

func NewPoldaAccidentRepo(db *gorm.DB) interfacepolda.RepositoryPoldaInterface {
	return &poldaAccidentRepo{db: db}
}

func (r *poldaAccidentRepo) Create(data *domainpolda.PoldaAccident) error {
	return r.db.Create(data).Error
}

func (r *poldaAccidentRepo) GetAll(params filter.BaseParams) ([]domainpolda.PoldaAccident, int64, error) {
	var data []domainpolda.PoldaAccident
	var total int64

	query := r.db.Model(&domainpolda.PoldaAccident{})

	// Apply search - multiple fields like accident repo
	if params.Search != "" {
		search := "%" + params.Search + "%"
		query = query.Where("LOWER(police_unit) LIKE LOWER(?) OR LOWER(period) LIKE LOWER(?)", search, search)
	}

	// Apply filters - generic handling like accident repo
	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch v := value.(type) {
		case string:
			if v == "" {
				continue
			}
			// Special handling for LIKE searches
			if key == "police_unit" {
				query = query.Where("LOWER(police_unit) LIKE LOWER(?)", "%"+v+"%")
			} else {
				query = query.Where(fmt.Sprintf("%s = ?", key), v)
			}
		case []string, []int:
			query = query.Where(fmt.Sprintf("%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		}
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply ordering with validation like accident repo
	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"police_unit":         true,
			"total_accidents":     true,
			"total_deaths":        true,
			"total_severe_injury": true,
			"total_minor_injury":  true,
			"period":              true,
			"created_at":          true,
			"updated_at":          true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	// Apply pagination
	if err := query.Offset(params.Offset).Limit(params.Limit).Find(&data).Error; err != nil {
		return nil, 0, err
	}

	return data, total, nil
}

func (r *poldaAccidentRepo) GetByID(id string) (*domainpolda.PoldaAccident, error) {
	var data domainpolda.PoldaAccident
	if err := r.db.Where("id = ?", id).First(&data).Error; err != nil {
		return nil, err
	}
	return &data, nil
}

func (r *poldaAccidentRepo) Update(id string, data *domainpolda.PoldaAccident) error {
	return r.db.Where("id = ?", id).Updates(data).Error
}

func (r *poldaAccidentRepo) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domainpolda.PoldaAccident{}).Error
}
