package repositoryschool

import (
	"fmt"
	domainschool "safety-riding/internal/domain/school"
	interfaceschool "safety-riding/internal/interfaces/school"
	"safety-riding/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewSchoolRepo(db *gorm.DB) interfaceschool.RepoSchoolInterface {
	return &repo{
		DB: db,
	}
}

func (r *repo) Create(school domainschool.School) error {
	return r.DB.Create(&school).Error
}

func (r *repo) GetByID(id string) (domainschool.School, error) {
	var school domainschool.School
	err := r.DB.Where("id = ?", id).First(&school).Error
	return school, err
}

func (r *repo) Update(school domainschool.School) error {
	return r.DB.Save(&school).Error
}

func (r *repo) Fetch(params filter.BaseParams) (ret []domainschool.School, totalData int64, err error) {
	query := r.DB.Model(&domainschool.School{}).Debug()

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
			"name":          true,
			"npsn":          true,
			"student_count": true,
			"teacher_count": true,
			"major_count":   true,
			"visit_count":   true,
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

func (r *repo) Delete(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainschool.School{}).Error
}

func (r *repo) GetEducationStats(params filter.BaseParams) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := r.DB.Table("schools").
		Select(`
			schools.id,
			schools.name,
			schools.npsn,
			schools.district_id,
			schools.district_name,
			schools.city_id,
			schools.city_name,
			schools.province_id,
			schools.province_name,
			schools.student_count,
			schools.is_educated,
			COALESCE(SUM(events.attendees_count), 0) as total_student_educated
		`).
		Joins("LEFT JOIN events ON schools.id = events.school_id AND events.deleted_at IS NULL").
		Where("events.status = 'completed' AND schools.is_educated = true AND schools.deleted_at IS NULL").
		Group("schools.id, schools.name, schools.npsn, schools.district_id, schools.district_name, schools.city_id, schools.city_name, schools.province_id, schools.province_name, schools.student_count, schools.is_educated")

	// Apply search filter
	if params.Search != "" {
		query = query.Where("LOWER(schools.name) LIKE LOWER(?)", "%"+params.Search+"%")
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
			query = query.Where(fmt.Sprintf("schools.%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("schools.%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("schools.%s = ?", key), v)
		}
	}

	// Apply ordering
	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"name":                   true,
			"npsn":                   true,
			"student_count":          true,
			"is_educated":            true,
			"total_student_educated": true,
		}

		if _, ok := validColumns[params.OrderBy]; ok {
			if params.OrderBy == "total_student_educated" {
				query = query.Order(fmt.Sprintf("total_student_educated %s", params.OrderDirection))
			} else {
				query = query.Order(fmt.Sprintf("schools.%s %s", params.OrderBy, params.OrderDirection))
			}
		}
	} else {
		query = query.Order("schools.name ASC")
	}

	// Apply pagination
	if params.Limit > 0 {
		query = query.Offset(params.Offset).Limit(params.Limit)
	}

	err := query.Scan(&results).Error
	return results, err
}
