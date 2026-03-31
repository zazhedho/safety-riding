package interfaceapprovalrecord

import (
	domainapprovalrecord "safety-riding/internal/domain/approvalrecord"
	"safety-riding/pkg/filter"
	"time"
)

type RepoApprovalRecordInterface interface {
	Fetch(params filter.BaseParams) ([]domainapprovalrecord.ApprovalRecord, int64, error)
	GetByID(id string) (domainapprovalrecord.ApprovalRecord, error)
	GetLatestSyncedAt() (*time.Time, error)
	GetExistingResponseIDs(responseIDs []string) (map[string]struct{}, error)
	RestoreByResponseIDs(responseIDs []string) error
	SoftDeleteMissing(responseIDs []string) error
	Upsert(records []domainapprovalrecord.ApprovalRecord) error
}
