package repositoryschool

import (
	"fmt"
	domainschool "safety-riding/internal/domain/school"
	"safety-riding/internal/dto"
	interfaceschool "safety-riding/internal/interfaces/school"
	"safety-riding/pkg/filter"
	"strconv"

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
			"phone":         true,
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
			COALESCE(SUM(CASE WHEN schools.is_educated = TRUE then events.attendees_count ELSE 0 END), 0) as total_student_educated
		`).
		Joins("LEFT JOIN events ON schools.id = events.school_id AND events.deleted_at IS NULL").
		Where("schools.deleted_at IS NULL").
		Group("schools.id, schools.name, schools.npsn, schools.district_id, schools.district_name, schools.city_id, schools.city_name, schools.province_id, schools.province_name, schools.student_count, schools.is_educated")

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

// GetEducationPriorityData returns combined data from market share, schools, and accidents for priority matrix
func (r *repo) GetEducationPriorityData(params filter.BaseParams) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	// Build the complex query that joins market_shares, schools, and accidents by district
	query := r.DB.Raw(`
		WITH district_market AS (
			SELECT
				district_id,
				district_name,
				city_id,
				city_name,
				province_id,
				province_name,
				COALESCE(AVG(monthly_sales_percentage), 0) as market_share,
				COALESCE(SUM(monthly_sales), 0) as total_sales,
				COALESCE(AVG(monthly_competitor_percentage), 0) as competitor_share
			FROM market_shares
			WHERE deleted_at IS NULL
			` + buildMarketShareFilters(params) + `
			GROUP BY district_id, district_name, city_id, city_name, province_id, province_name
		),
		district_schools AS (
			SELECT
				district_id,
				COUNT(*) as total_schools,
				COALESCE(SUM(student_count), 0) as total_students,
				COALESCE(SUM(CASE WHEN is_educated = TRUE THEN 1 ELSE 0 END), 0) as educated_schools
			FROM schools
			WHERE deleted_at IS NULL
			GROUP BY district_id
		),
		district_school_educated AS (
			SELECT
				s.district_id,
				COALESCE(SUM(e.attendees_count), 0) as total_student_educated
			FROM schools s
			LEFT JOIN events e ON s.id = e.school_id AND e.deleted_at IS NULL
			WHERE s.deleted_at IS NULL AND s.is_educated = TRUE
			` + buildEventFilters(params) + `
			GROUP BY s.district_id
		),
		district_accidents AS (
			SELECT
				district_id,
				COUNT(*) as total_accidents,
				COALESCE(SUM(death_count), 0) as total_deaths,
				COALESCE(SUM(injured_count), 0) as total_injured,
				COALESCE(SUM(minor_injured_count), 0) as total_minor_injured
			FROM accidents
			WHERE deleted_at IS NULL
			` + buildAccidentFilters(params) + `
			GROUP BY district_id
		)
		SELECT
			dm.province_id,
			dm.province_name,
			dm.city_id,
			dm.city_name,
			dm.district_id,
			dm.district_name,
			dm.market_share,
			dm.total_sales,
			dm.competitor_share,
			COALESCE(ds.total_schools, 0) as total_schools,
			COALESCE(ds.total_students, 0) as total_students,
			COALESCE(ds.educated_schools, 0) as educated_schools,
			COALESCE(dse.total_student_educated, 0) as total_student_educated,
			COALESCE(da.total_accidents, 0) as total_accidents,
			COALESCE(da.total_deaths, 0) as total_deaths,
			COALESCE(da.total_injured, 0) as total_injured,
			COALESCE(da.total_minor_injured, 0) as total_minor_injured
		FROM district_market dm
		LEFT JOIN district_schools ds ON dm.district_id = ds.district_id
		LEFT JOIN district_school_educated dse ON dm.district_id = dse.district_id
		LEFT JOIN district_accidents da ON dm.district_id = da.district_id
		WHERE 1=1
		` + buildLocationFilters(params) + `
		ORDER BY dm.market_share ASC, da.total_accidents DESC, ds.total_students DESC
	`)

	err := query.Scan(&results).Error
	return results, err
}

// Helper functions to build filter clauses
func buildMarketShareFilters(params filter.BaseParams) string {
	var filters string

	if monthVal, ok := params.Filters["month"]; ok {
		monthStr := fmt.Sprintf("%v", monthVal)
		if monthStr != "" {
			filters += fmt.Sprintf(" AND month = %s", monthStr)
		}
	}

	if yearVal, ok := params.Filters["year"]; ok {
		yearStr := fmt.Sprintf("%v", yearVal)
		if yearStr != "" {
			filters += fmt.Sprintf(" AND year = %s", yearStr)
		}
	}

	return filters
}

func buildEventFilters(params filter.BaseParams) string {
	var filters string

	if monthVal, ok := params.Filters["month"]; ok {
		monthStr := fmt.Sprintf("%v", monthVal)
		if monthStr != "" {
			filters += fmt.Sprintf(" AND EXTRACT(MONTH FROM e.event_date::date) = %s", monthStr)
		}
	}

	if yearVal, ok := params.Filters["year"]; ok {
		yearStr := fmt.Sprintf("%v", yearVal)
		if yearStr != "" {
			filters += fmt.Sprintf(" AND EXTRACT(YEAR FROM e.event_date::date) = %s", yearStr)
		}
	}

	return filters
}

func buildAccidentFilters(params filter.BaseParams) string {
	var filters string

	if monthVal, ok := params.Filters["month"]; ok {
		monthStr := fmt.Sprintf("%v", monthVal)
		if monthStr != "" {
			filters += fmt.Sprintf(" AND EXTRACT(MONTH FROM accident_date::date) = %s", monthStr)
		}
	}

	if yearVal, ok := params.Filters["year"]; ok {
		yearStr := fmt.Sprintf("%v", yearVal)
		if yearStr != "" {
			filters += fmt.Sprintf(" AND EXTRACT(YEAR FROM accident_date::date) = %s", yearStr)
		}
	}

	return filters
}

func buildLocationFilters(params filter.BaseParams) string {
	var filters string

	if provinceId, ok := params.Filters["province_id"]; ok {
		provinceStr := fmt.Sprintf("%v", provinceId)
		if provinceStr != "" {
			filters += fmt.Sprintf(" AND dm.province_id = '%s'", provinceStr)
		}
	}

	if cityId, ok := params.Filters["city_id"]; ok {
		cityStr := fmt.Sprintf("%v", cityId)
		if cityStr != "" {
			filters += fmt.Sprintf(" AND dm.city_id = '%s'", cityStr)
		}
	}

	if districtId, ok := params.Filters["district_id"]; ok {
		districtStr := fmt.Sprintf("%v", districtId)
		if districtStr != "" {
			filters += fmt.Sprintf(" AND dm.district_id = '%s'", districtStr)
		}
	}

	return filters
}

func (r *repo) GetSummary() (*dto.SchoolSummary, error) {
	var result dto.SchoolSummary
	err := r.DB.Model(&domainschool.School{}).
		Select("COUNT(*) as total_schools, COALESCE(SUM(student_count), 0) as total_students, COALESCE(SUM(teacher_count), 0) as total_teachers").
		Where("deleted_at IS NULL").
		Scan(&result).Error
	return &result, err
}

func (r *repo) GetForMap() ([]dto.SchoolMapItem, error) {
	var results []dto.SchoolMapItem
	err := r.DB.Model(&domainschool.School{}).
		Select("id, name, npsn, address, phone, latitude, longitude").
		Where("deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL").
		Scan(&results).Error
	return results, err
}
