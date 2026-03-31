package dto

import (
	domainapprovalrecord "safety-riding/internal/domain/approvalrecord"
	"time"
)

type ApprovalRecordSourceInfo struct {
	SheetURL        string     `json:"sheet_url"`
	LastSyncedAt    *time.Time `json:"last_synced_at,omitempty"`
	LastSyncStatus  string     `json:"last_sync_status"`
	LastSyncMessage string     `json:"last_sync_message,omitempty"`
}

type ApprovalRecordSyncResult struct {
	FetchedRows  int                      `json:"fetched_rows"`
	InsertedRows int                      `json:"inserted_rows"`
	UpdatedRows  int                      `json:"updated_rows"`
	Skipped      bool                     `json:"skipped"`
	Message      string                   `json:"message"`
	Source       ApprovalRecordSourceInfo `json:"source"`
}

type ApprovalRecordListItem struct {
	ID               string     `json:"id"`
	RequestNumber    int        `json:"request_number"`
	SubmittedAt      *time.Time `json:"submitted_at,omitempty"`
	FullName         string     `json:"full_name"`
	Email            string     `json:"email"`
	Whatsapp         string     `json:"whatsapp"`
	ActivityName     string     `json:"activity_name"`
	ParticipantCount int        `json:"participant_count"`
	LatestStatus     string     `json:"latest_status"`
	SyncedAt         time.Time  `json:"synced_at"`
}

type ApprovalRecordDetail struct {
	ID                   string                                `json:"id"`
	RequestNumber        int                                   `json:"request_number"`
	SubmittedAt          *time.Time                            `json:"submitted_at,omitempty"`
	FullName             string                                `json:"full_name"`
	Email                string                                `json:"email"`
	Whatsapp             string                                `json:"whatsapp"`
	FullAddress          string                                `json:"full_address"`
	ActivityName         string                                `json:"activity_name"`
	ParticipantCount     int                                   `json:"participant_count"`
	EventDate            *time.Time                            `json:"event_date,omitempty"`
	EventTime            string                                `json:"event_time"`
	Material             string                                `json:"material"`
	TrainingDuration     string                                `json:"training_duration"`
	AreaType             string                                `json:"area_type"`
	EventLocationAddress string                                `json:"event_location_address"`
	EmailAddress         string                                `json:"email_address"`
	TrainingType         string                                `json:"training_type"`
	SheetStatus          string                                `json:"sheet_status"`
	LatestStatus         string                                `json:"latest_status"`
	SyncedAt             time.Time                             `json:"synced_at"`
	Approvals            []domainapprovalrecord.ApprovalRecord `json:"approvals"`
}
