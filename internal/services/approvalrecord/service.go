package serviceapprovalrecord

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	domainappconfig "safety-riding/internal/domain/appconfig"
	domainapprovalrecord "safety-riding/internal/domain/approvalrecord"
	"safety-riding/internal/dto"
	interfaceappconfig "safety-riding/internal/interfaces/appconfig"
	interfaceapprovalrecord "safety-riding/internal/interfaces/approvalrecord"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"strconv"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"
)

const syncStaleDuration = time.Minute
const approvalRecordSheetURLConfigKey = "approval_records.sheet_url"

type recipientPayload struct {
	Recipient    string `json:"recipient"`
	Status       string `json:"status"`
	IssueDate    string `json:"issue_date,omitempty"`
	ResponseDate string `json:"response_date,omitempty"`
	Comment      string `json:"comment,omitempty"`
	Settings     string `json:"settings,omitempty"`
}

type ApprovalRecordService struct {
	Repo       interfaceapprovalrecord.RepoApprovalRecordInterface
	ConfigRepo interfaceappconfig.RepoAppConfigInterface
	HTTPClient *http.Client
	syncMu     sync.Mutex
}

func NewApprovalRecordService(
	repo interfaceapprovalrecord.RepoApprovalRecordInterface,
	configRepo interfaceappconfig.RepoAppConfigInterface,
) *ApprovalRecordService {
	return &ApprovalRecordService{
		Repo:       repo,
		ConfigRepo: configRepo,
		HTTPClient: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (s *ApprovalRecordService) GetSourceConfig() (dto.ApprovalRecordSourceInfo, error) {
	config, err := s.getSheetURLConfig()
	if err != nil {
		return dto.ApprovalRecordSourceInfo{}, err
	}

	lastSyncedAt, err := s.Repo.GetLatestSyncedAt()
	if err != nil {
		return dto.ApprovalRecordSourceInfo{}, err
	}

	status := "never"
	message := ""
	if lastSyncedAt != nil {
		status = "success"
		message = "Last sync time derived from stored approval records"
	}

	return dto.ApprovalRecordSourceInfo{
		SheetURL:        config.Value,
		LastSyncedAt:    lastSyncedAt,
		LastSyncStatus:  status,
		LastSyncMessage: message,
	}, nil
}

func (s *ApprovalRecordService) Fetch(params filter.BaseParams) ([]domainapprovalrecord.ApprovalRecord, int64, error) {
	return s.Repo.Fetch(params)
}

func (s *ApprovalRecordService) GetByID(id string) (domainapprovalrecord.ApprovalRecord, error) {
	return s.Repo.GetByID(id)
}

func (s *ApprovalRecordService) Sync(username string, force bool) (dto.ApprovalRecordSyncResult, error) {
	if !s.syncMu.TryLock() {
		return dto.ApprovalRecordSyncResult{}, fmt.Errorf("sync is already in progress")
	}
	defer s.syncMu.Unlock()

	config, err := s.getSheetURLConfig()
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	lastSyncedAt, err := s.Repo.GetLatestSyncedAt()
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	sourceInfo := dto.ApprovalRecordSourceInfo{
		SheetURL:       config.Value,
		LastSyncedAt:   lastSyncedAt,
		LastSyncStatus: "never",
	}
	if lastSyncedAt != nil {
		sourceInfo.LastSyncStatus = "success"
		sourceInfo.LastSyncMessage = "Last sync time derived from stored approval records"
	}

	if !force && lastSyncedAt != nil && time.Since(*lastSyncedAt) < syncStaleDuration {
		return dto.ApprovalRecordSyncResult{
			Skipped: true,
			Message: fmt.Sprintf("sync skipped because data was refreshed less than %d seconds ago", int(syncStaleDuration.Seconds())),
			Source:  sourceInfo,
		}, nil
	}

	exportURL, err := buildSheetExportURL(config.Value)
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	req, err := http.NewRequest(http.MethodGet, exportURL, nil)
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		err = fmt.Errorf("failed to fetch sheet CSV, status code: %d", resp.StatusCode)
		return dto.ApprovalRecordSyncResult{}, err
	}

	reader := csv.NewReader(resp.Body)
	reader.FieldsPerRecord = -1

	headers, err := reader.Read()
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	records := make([]domainapprovalrecord.ApprovalRecord, 0)
	responseIDs := make([]string, 0)
	rowNumber := 1

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return dto.ApprovalRecordSyncResult{}, err
		}

		rowNumber++
		rowMap := make(map[string]string, len(headers))
		for i, header := range headers {
			if i < len(row) {
				rowMap[header] = strings.TrimSpace(row[i])
			} else {
				rowMap[header] = ""
			}
		}

		record, ok, err := buildApprovalRecord(rowNumber, rowMap)
		if err != nil {
			return dto.ApprovalRecordSyncResult{}, err
		}
		if !ok {
			continue
		}

		records = append(records, record)
		responseIDs = append(responseIDs, record.ResponseID)
	}

	existing, err := s.Repo.GetExistingResponseIDs(responseIDs)
	if err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	insertedRows := 0
	updatedRows := 0
	for _, record := range records {
		if _, ok := existing[record.ResponseID]; ok {
			updatedRows++
		} else {
			insertedRows++
		}
	}

	if err := s.Repo.Upsert(records); err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	if err := s.Repo.RestoreByResponseIDs(responseIDs); err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	if err := s.Repo.SoftDeleteMissing(responseIDs); err != nil {
		return dto.ApprovalRecordSyncResult{}, err
	}

	now := time.Now()
	sourceInfo = dto.ApprovalRecordSourceInfo{
		SheetURL:        config.Value,
		LastSyncedAt:    &now,
		LastSyncStatus:  "success",
		LastSyncMessage: fmt.Sprintf("Synced %d rows from Google Sheets", len(records)),
	}

	return dto.ApprovalRecordSyncResult{
		FetchedRows:  len(records),
		InsertedRows: insertedRows,
		UpdatedRows:  updatedRows,
		Skipped:      false,
		Message:      "approval records synced successfully",
		Source:       sourceInfo,
	}, nil
}

func buildSheetExportURL(sheetURL string) (string, error) {
	sheetURL = strings.TrimSpace(sheetURL)
	if sheetURL == "" {
		return "", fmt.Errorf("sheet URL is required")
	}

	parsed, err := url.Parse(sheetURL)
	if err != nil {
		return "", fmt.Errorf("invalid sheet URL: %w", err)
	}

	pathParts := strings.Split(parsed.Path, "/")
	sheetID := ""
	for i := 0; i < len(pathParts); i++ {
		if pathParts[i] == "d" && i+1 < len(pathParts) {
			sheetID = pathParts[i+1]
			break
		}
	}
	if sheetID == "" {
		return "", fmt.Errorf("unable to extract spreadsheet ID from URL")
	}

	gid := parsed.Query().Get("gid")
	if gid == "" && parsed.Fragment != "" {
		fragmentValues, _ := url.ParseQuery(parsed.Fragment)
		gid = fragmentValues.Get("gid")
		if gid == "" && strings.HasPrefix(parsed.Fragment, "gid=") {
			gid = strings.TrimPrefix(parsed.Fragment, "gid=")
		}
	}
	if gid == "" {
		gid = "0"
	}

	return fmt.Sprintf("https://docs.google.com/spreadsheets/d/%s/export?format=csv&gid=%s", sheetID, gid), nil
}

func buildApprovalRecord(rowNumber int, rowMap map[string]string) (domainapprovalrecord.ApprovalRecord, bool, error) {
	responseID := strings.TrimSpace(rowMap["Response Id"])
	if responseID == "" {
		return domainapprovalrecord.ApprovalRecord{}, false, nil
	}

	submittedAt, err := parseOptionalTime(rowMap["Timestamp"])
	if err != nil {
		return domainapprovalrecord.ApprovalRecord{}, false, fmt.Errorf("invalid timestamp for response %s: %w", responseID, err)
	}

	requestNumber := parseInt(rowMap["Request #"])
	revisionNumber := parseInt(rowMap["Revision #"])
	totalRecipients := parseInt(rowMap["Total Recipients"])

	recipients := extractRecipients(rowMap)
	recipientsJSON, err := json.Marshal(recipients)
	if err != nil {
		return domainapprovalrecord.ApprovalRecord{}, false, err
	}

	rawJSON, err := json.Marshal(rowMap)
	if err != nil {
		return domainapprovalrecord.ApprovalRecord{}, false, err
	}

	now := time.Now()
	return domainapprovalrecord.ApprovalRecord{
		ID:                 utils.CreateUUID(),
		SourceRowNumber:    rowNumber,
		SubmittedAt:        submittedAt,
		ResponseID:         responseID,
		RequestNumber:      requestNumber,
		RevisionNumber:     revisionNumber,
		OverallStatus:      rowMap["Overall Status"],
		Requestor:          rowMap["Requestor"],
		EditResponseURL:    rowMap["Edit Response Url"],
		TotalRecipients:    totalRecipients,
		ParticipantIDsJSON: rowMap["Participant Ids"],
		RecipientsJSON:     string(recipientsJSON),
		RawPayloadJSON:     string(rawJSON),
		SyncedAt:           now,
		CreatedAt:          now,
		UpdatedAt:          &now,
	}, true, nil
}

func extractRecipients(rowMap map[string]string) []recipientPayload {
	recipients := make([]recipientPayload, 0, 10)
	for i := 1; i <= 10; i++ {
		prefix := fmt.Sprintf("Recipient %d", i)
		recipient := recipientPayload{
			Recipient:    strings.TrimSpace(rowMap[prefix]),
			Status:       strings.TrimSpace(rowMap[prefix+" Status"]),
			IssueDate:    strings.TrimSpace(rowMap[prefix+" Issue Date"]),
			ResponseDate: strings.TrimSpace(rowMap[prefix+" Response Date"]),
			Comment:      strings.TrimSpace(rowMap[prefix+" Comment"]),
			Settings:     strings.TrimSpace(rowMap[prefix+" Settings"]),
		}

		if recipient.Recipient == "" &&
			recipient.Status == "" &&
			recipient.IssueDate == "" &&
			recipient.ResponseDate == "" &&
			recipient.Comment == "" &&
			recipient.Settings == "" {
			continue
		}

		recipients = append(recipients, recipient)
	}

	return recipients
}

func parseOptionalTime(raw string) (*time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	layouts := []string{
		"Jan 2, 2006 15:04",
		"Jan 02, 2006 15:04",
		time.RFC3339,
	}

	for _, layout := range layouts {
		if parsed, err := time.ParseInLocation(layout, raw, time.Local); err == nil {
			return &parsed, nil
		}
	}

	return nil, fmt.Errorf("unsupported time format: %s", raw)
}

func parseInt(raw string) int {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 0
	}

	val, err := strconv.Atoi(raw)
	if err != nil {
		return 0
	}

	return val
}

var _ interfaceapprovalrecord.ServiceApprovalRecordInterface = (*ApprovalRecordService)(nil)

func (s *ApprovalRecordService) getSheetURLConfig() (domainappconfig.AppConfig, error) {
	if s.ConfigRepo == nil {
		return domainappconfig.AppConfig{}, gorm.ErrRecordNotFound
	}

	config, err := s.ConfigRepo.GetByKey(approvalRecordSheetURLConfigKey)
	if err != nil {
		return domainappconfig.AppConfig{}, err
	}
	if !config.IsActive {
		return domainappconfig.AppConfig{}, errors.New("approval records sheet URL config is inactive")
	}

	return config, nil
}
