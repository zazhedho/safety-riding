package serviceapprovalrecord

import (
	"fmt"
	"net/http"
	"safety-riding/internal/dto"
	interfaceappconfig "safety-riding/internal/interfaces/appconfig"
	interfaceapprovalrecord "safety-riding/internal/interfaces/approvalrecord"
	interfacesubmittedform "safety-riding/internal/interfaces/submittedform"
	"safety-riding/pkg/filter"
	"sync"
	"time"
)

const syncStaleDuration = time.Minute
const approvalRecordSheetURLConfigKey = "approval_records.sheet_url"
const submittedFormSheetURLConfigKey = "approval_records.submitted_forms_sheet_url"

type recipientPayload struct {
	Recipient    string `json:"recipient"`
	Status       string `json:"status"`
	IssueDate    string `json:"issue_date,omitempty"`
	ResponseDate string `json:"response_date,omitempty"`
	Comment      string `json:"comment,omitempty"`
	Settings     string `json:"settings,omitempty"`
}

type ApprovalRecordService struct {
	Repo              interfaceapprovalrecord.RepoApprovalRecordInterface
	SubmittedFormRepo interfacesubmittedform.RepoSubmittedFormInterface
	ConfigRepo        interfaceappconfig.RepoAppConfigInterface
	HTTPClient        *http.Client
	syncMu            sync.Mutex
}

func NewApprovalRecordService(
	repo interfaceapprovalrecord.RepoApprovalRecordInterface,
	submittedFormRepo interfacesubmittedform.RepoSubmittedFormInterface,
	configRepo interfaceappconfig.RepoAppConfigInterface,
) *ApprovalRecordService {
	return &ApprovalRecordService{
		Repo:              repo,
		SubmittedFormRepo: submittedFormRepo,
		ConfigRepo:        configRepo,
		HTTPClient: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (s *ApprovalRecordService) GetSourceConfig() (dto.ApprovalRecordSourceInfo, error) {
	config, err := s.getSheetURLConfig(submittedFormSheetURLConfigKey)
	if err != nil {
		return dto.ApprovalRecordSourceInfo{}, err
	}

	lastSyncedAt, err := s.SubmittedFormRepo.GetLatestSyncedAt()
	if err != nil {
		return dto.ApprovalRecordSourceInfo{}, err
	}

	status := "never"
	message := ""
	if lastSyncedAt != nil {
		status = "success"
		message = "Last sync time derived from stored submitted forms"
	}

	return dto.ApprovalRecordSourceInfo{
		SheetURL:        config.Value,
		LastSyncedAt:    lastSyncedAt,
		LastSyncStatus:  status,
		LastSyncMessage: message,
	}, nil
}

func (s *ApprovalRecordService) Fetch(params filter.BaseParams) ([]dto.ApprovalRecordListItem, int64, error) {
	forms, totalData, err := s.SubmittedFormRepo.Fetch(params)
	if err != nil {
		return nil, 0, err
	}

	items := make([]dto.ApprovalRecordListItem, 0, len(forms))
	for _, form := range forms {
		items = append(items, dto.ApprovalRecordListItem{
			ID:               form.ID,
			RequestNumber:    form.RequestNumber,
			SubmittedAt:      form.SubmittedAt,
			FullName:         form.FullName,
			Email:            form.Email,
			Whatsapp:         form.Whatsapp,
			ActivityName:     form.ActivityName,
			ParticipantCount: form.ParticipantCount,
			LatestStatus:     form.LatestStatus,
			SyncedAt:         form.SyncedAt,
		})
	}

	return items, totalData, nil
}

func (s *ApprovalRecordService) GetByID(id string) (dto.ApprovalRecordDetail, error) {
	form, err := s.SubmittedFormRepo.GetByID(id)
	if err != nil {
		return dto.ApprovalRecordDetail{}, err
	}

	approvals, err := s.Repo.FetchByRequestNumber(form.RequestNumber)
	if err != nil {
		return dto.ApprovalRecordDetail{}, err
	}

	return dto.ApprovalRecordDetail{
		ID:                   form.ID,
		RequestNumber:        form.RequestNumber,
		SubmittedAt:          form.SubmittedAt,
		FullName:             form.FullName,
		Email:                form.Email,
		Whatsapp:             form.Whatsapp,
		FullAddress:          form.FullAddress,
		ActivityName:         form.ActivityName,
		ParticipantCount:     form.ParticipantCount,
		EventDate:            form.EventDate,
		EventTime:            form.EventTime,
		Material:             form.Material,
		TrainingDuration:     form.TrainingDuration,
		AreaType:             form.AreaType,
		EventLocationAddress: form.EventLocationAddress,
		EmailAddress:         form.EmailAddress,
		TrainingType:         form.TrainingType,
		SheetStatus:          form.SheetStatus,
		LatestStatus:         form.LatestStatus,
		SyncedAt:             form.SyncedAt,
		Approvals:            approvals,
	}, nil
}

func (s *ApprovalRecordService) Sync(username string, force bool) (dto.ApprovalRecordSyncResult, error) {
	if !s.syncMu.TryLock() {
		return dto.ApprovalRecordSyncResult{}, fmt.Errorf("sync is already in progress")
	}
	defer s.syncMu.Unlock()

	submittedConfig, err := s.getSheetURLConfig(submittedFormSheetURLConfigKey)
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	approvalConfig, err := s.getSheetURLConfig(approvalRecordSheetURLConfigKey)
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	lastSyncedAt, err := s.SubmittedFormRepo.GetLatestSyncedAt()
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	sourceInfo := dto.ApprovalRecordSourceInfo{
		SheetURL:       submittedConfig.Value,
		LastSyncedAt:   lastSyncedAt,
		LastSyncStatus: "never",
	}
	if lastSyncedAt != nil {
		sourceInfo.LastSyncStatus = "success"
		sourceInfo.LastSyncMessage = "Last sync time derived from stored submitted forms"
	}

	if !force && lastSyncedAt != nil && time.Since(*lastSyncedAt) < syncStaleDuration {
		return dto.ApprovalRecordSyncResult{
			Skipped: true,
			Message: fmt.Sprintf("sync skipped because data was refreshed less than %d seconds ago", int(syncStaleDuration.Seconds())),
			Source:  sourceInfo,
		}, nil
	}

	approvalRecords, approvalFetchedRows, approvalInsertedRows, approvalUpdatedRows, err := s.syncApprovalSheet(approvalConfig.Value)
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	latestStatusMap := buildLatestStatusMap(approvalRecords)

	submittedForms, submittedFetchedRows, submittedInsertedRows, submittedUpdatedRows, err := s.syncSubmittedFormsSheet(submittedConfig.Value, latestStatusMap)
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	now := time.Now()
	sourceInfo = dto.ApprovalRecordSourceInfo{
		SheetURL:        submittedConfig.Value,
		LastSyncedAt:    &now,
		LastSyncStatus:  "success",
		LastSyncMessage: fmt.Sprintf("Synced %d submitted forms and %d approval records", len(submittedForms), len(approvalRecords)),
	}

	return dto.ApprovalRecordSyncResult{
		FetchedRows:  submittedFetchedRows + approvalFetchedRows,
		InsertedRows: submittedInsertedRows + approvalInsertedRows,
		UpdatedRows:  submittedUpdatedRows + approvalUpdatedRows,
		Skipped:      false,
		Message:      "submitted forms and approval records synced successfully",
		Source:       sourceInfo,
	}, nil
}
