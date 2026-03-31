package repositoryapprovalrecord

import (
	"database/sql"
	"fmt"
	"safety-riding/internal/domain/approvalrecord"
	"safety-riding/internal/interfaces/approvalrecord"
	"safety-riding/pkg/filter"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type repo struct {
	DB *gorm.DB
}

func NewApprovalRecordRepo(db *gorm.DB) interfaceapprovalrecord.RepoApprovalRecordInterface {
	return &repo{DB: db}
}

func (r *repo) Fetch(params filter.BaseParams) (ret []domainapprovalrecord.ApprovalRecord, totalData int64, err error) {
	query := r.DB.Model(&domainapprovalrecord.ApprovalRecord{}).Where("deleted_at IS NULL")

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where(
			"LOWER(response_id) LIKE LOWER(?) OR LOWER(requestor) LIKE LOWER(?) OR CAST(request_number AS TEXT) LIKE ?",
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
			"submitted_at":     true,
			"request_number":   true,
			"revision_number":  true,
			"overall_status":   true,
			"requestor":        true,
			"total_recipients": true,
			"synced_at":        true,
			"created_at":       true,
			"updated_at":       true,
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

func (r *repo) GetByID(id string) (ret domainapprovalrecord.ApprovalRecord, err error) {
	err = r.DB.
		Where("id = ? AND deleted_at IS NULL", id).
		First(&ret).Error
	return
}

func (r *repo) GetLatestSyncedAt() (*time.Time, error) {
	var latest sql.NullTime
	err := r.DB.Model(&domainapprovalrecord.ApprovalRecord{}).
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

func (r *repo) GetExistingResponseIDs(responseIDs []string) (map[string]struct{}, error) {
	if len(responseIDs) == 0 {
		return map[string]struct{}{}, nil
	}

	var existing []string
	if err := r.DB.
		Model(&domainapprovalrecord.ApprovalRecord{}).
		Where("response_id IN ? AND deleted_at IS NULL", responseIDs).
		Pluck("response_id", &existing).Error; err != nil {
		return nil, err
	}

	result := make(map[string]struct{}, len(existing))
	for _, id := range existing {
		result[id] = struct{}{}
	}

	return result, nil
}

func (r *repo) RestoreByResponseIDs(responseIDs []string) error {
	if len(responseIDs) == 0 {
		return nil
	}

	return r.DB.Unscoped().
		Model(&domainapprovalrecord.ApprovalRecord{}).
		Where("response_id IN ?", responseIDs).
		Update("deleted_at", nil).Error
}

func (r *repo) SoftDeleteMissing(responseIDs []string) error {
	query := r.DB.Where("deleted_at IS NULL")
	if len(responseIDs) > 0 {
		query = query.Where("response_id NOT IN ?", responseIDs)
	}

	return query.Delete(&domainapprovalrecord.ApprovalRecord{}).Error
}

func (r *repo) Upsert(records []domainapprovalrecord.ApprovalRecord) error {
	if len(records) == 0 {
		return nil
	}

	return r.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "response_id"},
		},
		DoUpdates: clause.AssignmentColumns([]string{
			"source_row_number",
			"submitted_at",
			"request_number",
			"revision_number",
			"overall_status",
			"requestor",
			"edit_response_url",
			"total_recipients",
			"participant_ids_json",
			"recipients_json",
			"raw_payload_json",
			"synced_at",
			"updated_at",
		}),
	}).Create(&records).Error
}
