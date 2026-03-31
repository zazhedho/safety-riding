package domainapprovalrecord

import (
	"time"

	"gorm.io/gorm"
)

func (ApprovalRecord) TableName() string {
	return "approval_records"
}

type ApprovalRecord struct {
	ID                 string         `json:"id" gorm:"column:id;primaryKey"`
	SourceRowNumber    int            `json:"source_row_number" gorm:"column:source_row_number"`
	SubmittedAt        *time.Time     `json:"submitted_at,omitempty" gorm:"column:submitted_at"`
	ResponseID         string         `json:"response_id" gorm:"column:response_id"`
	RequestNumber      int            `json:"request_number" gorm:"column:request_number"`
	RevisionNumber     int            `json:"revision_number" gorm:"column:revision_number"`
	OverallStatus      string         `json:"overall_status" gorm:"column:overall_status"`
	Requestor          string         `json:"requestor" gorm:"column:requestor"`
	EditResponseURL    string         `json:"edit_response_url" gorm:"column:edit_response_url"`
	TotalRecipients    int            `json:"total_recipients" gorm:"column:total_recipients"`
	ParticipantIDsJSON string         `json:"participant_ids_json,omitempty" gorm:"column:participant_ids_json"`
	RecipientsJSON     string         `json:"recipients_json,omitempty" gorm:"column:recipients_json"`
	RawPayloadJSON     string         `json:"raw_payload_json,omitempty" gorm:"column:raw_payload_json"`
	SyncedAt           time.Time      `json:"synced_at" gorm:"column:synced_at"`
	CreatedAt          time.Time      `json:"created_at" gorm:"column:created_at"`
	UpdatedAt          *time.Time     `json:"updated_at,omitempty" gorm:"column:updated_at"`
	DeletedAt          gorm.DeletedAt `json:"-" gorm:"column:deleted_at"`
}
