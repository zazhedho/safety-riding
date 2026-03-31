package dto

import "time"

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
