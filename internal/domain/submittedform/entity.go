package domainsubmittedform

import (
	"time"

	"gorm.io/gorm"
)

func (SubmittedForm) TableName() string {
	return "submitted_forms"
}

type SubmittedForm struct {
	ID                   string         `json:"id" gorm:"column:id;primaryKey"`
	SourceRowNumber      int            `json:"source_row_number" gorm:"column:source_row_number"`
	ResponseKey          string         `json:"response_key" gorm:"column:response_key"`
	SubmittedAt          *time.Time     `json:"submitted_at,omitempty" gorm:"column:submitted_at"`
	RequestNumber        int            `json:"request_number" gorm:"column:request_number"`
	FullName             string         `json:"full_name" gorm:"column:full_name"`
	Email                string         `json:"email" gorm:"column:email"`
	Whatsapp             string         `json:"whatsapp" gorm:"column:whatsapp"`
	FullAddress          string         `json:"full_address" gorm:"column:full_address"`
	ActivityName         string         `json:"activity_name" gorm:"column:activity_name"`
	ParticipantCount     int            `json:"participant_count" gorm:"column:participant_count"`
	EventDate            *time.Time     `json:"event_date,omitempty" gorm:"column:event_date"`
	EventTime            string         `json:"event_time" gorm:"column:event_time"`
	Material             string         `json:"material" gorm:"column:material"`
	TrainingDuration     string         `json:"training_duration" gorm:"column:training_duration"`
	AreaType             string         `json:"area_type" gorm:"column:area_type"`
	EventLocationAddress string         `json:"event_location_address" gorm:"column:event_location_address"`
	EmailAddress         string         `json:"email_address" gorm:"column:email_address"`
	TrainingType         string         `json:"training_type" gorm:"column:training_type"`
	SheetStatus          string         `json:"sheet_status" gorm:"column:sheet_status"`
	LatestStatus         string         `json:"latest_status" gorm:"column:latest_status"`
	RawPayloadJSON       string         `json:"raw_payload_json,omitempty" gorm:"column:raw_payload_json"`
	SyncedAt             time.Time      `json:"synced_at" gorm:"column:synced_at"`
	CreatedAt            time.Time      `json:"created_at" gorm:"column:created_at"`
	UpdatedAt            *time.Time     `json:"updated_at,omitempty" gorm:"column:updated_at"`
	DeletedAt            gorm.DeletedAt `json:"-" gorm:"column:deleted_at"`
}
