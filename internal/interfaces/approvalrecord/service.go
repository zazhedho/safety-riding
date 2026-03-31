package interfaceapprovalrecord

import (
	domainapprovalrecord "safety-riding/internal/domain/approvalrecord"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceApprovalRecordInterface interface {
	GetSourceConfig() (dto.ApprovalRecordSourceInfo, error)
	Fetch(params filter.BaseParams) ([]domainapprovalrecord.ApprovalRecord, int64, error)
	GetByID(id string) (domainapprovalrecord.ApprovalRecord, error)
	Sync(username string, force bool) (dto.ApprovalRecordSyncResult, error)
}
