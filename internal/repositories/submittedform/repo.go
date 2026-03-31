package repositorysubmittedform

import (
	"database/sql"
	"fmt"
	domainsubmittedform "safety-riding/internal/domain/submittedform"
	interfacesubmittedform "safety-riding/internal/interfaces/submittedform"
	"safety-riding/pkg/filter"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type repo struct {
	DB *gorm.DB
}

func NewSubmittedFormRepo(db *gorm.DB) interfacesubmittedform.RepoSubmittedFormInterface {
	return &repo{DB: db}
}

func (r *repo) Fetch(params filter.BaseParams) (ret []domainsubmittedform.SubmittedForm, totalData int64, err error) {
	query := r.DB.Model(&domainsubmittedform.SubmittedForm{}).Where("deleted_at IS NULL")

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where(
			`LOWER(full_name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?) OR LOWER(whatsapp) LIKE LOWER(?) OR LOWER(activity_name) LIKE LOWER(?) OR CAST(request_number AS TEXT) LIKE ?`,
			searchPattern,
			searchPattern,
			searchPattern,
			searchPattern,
			searchPattern,
		)
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
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		}
	}

	if err = query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"submitted_at":      true,
			"request_number":    true,
			"full_name":         true,
			"activity_name":     true,
			"participant_count": true,
			"latest_status":     true,
			"created_at":        true,
			"updated_at":        true,
		}
		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	} else {
		query = query.Order("submitted_at DESC NULLS LAST").Order("request_number DESC")
	}

	if err = query.Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) GetByID(id string) (ret domainsubmittedform.SubmittedForm, err error) {
	err = r.DB.Where("id = ? AND deleted_at IS NULL", id).First(&ret).Error
	return
}

func (r *repo) GetLatestSyncedAt() (*time.Time, error) {
	var latest sql.NullTime
	err := r.DB.Model(&domainsubmittedform.SubmittedForm{}).
		Where("deleted_at IS NULL").
		Select("MAX(synced_at)").
		Scan(&latest).Error
	if err != nil {
		return nil, err
	}
	if !latest.Valid {
		return nil, nil
	}
	return &latest.Time, nil
}

func (r *repo) GetExistingResponseKeys(responseKeys []string) (map[string]struct{}, error) {
	if len(responseKeys) == 0 {
		return map[string]struct{}{}, nil
	}

	var existing []string
	if err := r.DB.
		Model(&domainsubmittedform.SubmittedForm{}).
		Where("response_key IN ? AND deleted_at IS NULL", responseKeys).
		Pluck("response_key", &existing).Error; err != nil {
		return nil, err
	}

	result := make(map[string]struct{}, len(existing))
	for _, key := range existing {
		result[key] = struct{}{}
	}
	return result, nil
}

func (r *repo) RestoreByResponseKeys(responseKeys []string) error {
	if len(responseKeys) == 0 {
		return nil
	}

	return r.DB.Unscoped().
		Model(&domainsubmittedform.SubmittedForm{}).
		Where("response_key IN ?", responseKeys).
		Update("deleted_at", nil).Error
}

func (r *repo) SoftDeleteMissing(responseKeys []string) error {
	query := r.DB.Where("deleted_at IS NULL")
	if len(responseKeys) > 0 {
		query = query.Where("response_key NOT IN ?", responseKeys)
	}

	return query.Delete(&domainsubmittedform.SubmittedForm{}).Error
}

func (r *repo) Upsert(forms []domainsubmittedform.SubmittedForm) error {
	if len(forms) == 0 {
		return nil
	}

	return r.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "response_key"},
		},
		DoUpdates: clause.AssignmentColumns([]string{
			"source_row_number",
			"submitted_at",
			"request_number",
			"full_name",
			"email",
			"whatsapp",
			"full_address",
			"activity_name",
			"participant_count",
			"event_date",
			"event_time",
			"material",
			"training_duration",
			"area_type",
			"event_location_address",
			"email_address",
			"training_type",
			"sheet_status",
			"latest_status",
			"raw_payload_json",
			"synced_at",
			"updated_at",
		}),
	}).Create(&forms).Error
}
