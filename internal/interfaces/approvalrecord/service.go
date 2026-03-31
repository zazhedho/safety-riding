package interfaceapprovalrecord

import (
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceApprovalRecordInterface interface {
	GetSourceConfig() (dto.ApprovalRecordSourceInfo, error)
	Fetch(params filter.BaseParams) ([]dto.ApprovalRecordListItem, int64, error)
	GetByID(id string) (dto.ApprovalRecordDetail, error)
	Sync(username string, force bool) (dto.ApprovalRecordSyncResult, error)
}
