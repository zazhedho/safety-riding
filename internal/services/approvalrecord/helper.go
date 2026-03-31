package serviceapprovalrecord

import (
	"crypto/sha1"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	domainappconfig "safety-riding/internal/domain/appconfig"
	domainapprovalrecord "safety-riding/internal/domain/approvalrecord"
	domainsubmittedform "safety-riding/internal/domain/submittedform"
	interfaceapprovalrecord "safety-riding/internal/interfaces/approvalrecord"
	"safety-riding/utils"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

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
		OverallStatus:      normalizeOverallStatus(rowMap["Overall Status"]),
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

func buildSubmittedForm(
	rowNumber int,
	rowMap map[string]string,
	latestStatusMap map[int]string,
) (domainsubmittedform.SubmittedForm, bool, error) {
	timestamp := strings.TrimSpace(rowMap["Timestamp"])
	fullName := strings.TrimSpace(rowMap["Nama Lengkap"])
	email := strings.TrimSpace(rowMap["Email"])
	activityName := strings.TrimSpace(rowMap["Nama Kegiatan"])
	if timestamp == "" && fullName == "" && email == "" && activityName == "" {
		return domainsubmittedform.SubmittedForm{}, false, nil
	}

	submittedAt, err := parseOptionalTime(timestamp)
	if err != nil {
		return domainsubmittedform.SubmittedForm{}, false, fmt.Errorf("invalid submission timestamp at row %d: %w", rowNumber, err)
	}

	eventDate, err := parseOptionalDate(rowMap["Tanggal"])
	if err != nil {
		return domainsubmittedform.SubmittedForm{}, false, fmt.Errorf("invalid event date at row %d: %w", rowNumber, err)
	}

	requestNumber := parseInt(rowMap["Request #"])
	sheetStatus := normalizeOverallStatus(rowMap["Overall Status"])
	latestStatus := sheetStatus
	if requestNumber != 0 {
		if status, ok := latestStatusMap[requestNumber]; ok && status != "" {
			latestStatus = status
		}
	}

	rawJSON, err := json.Marshal(rowMap)
	if err != nil {
		return domainsubmittedform.SubmittedForm{}, false, err
	}

	now := time.Now()
	return domainsubmittedform.SubmittedForm{
		ID:                   utils.CreateUUID(),
		SourceRowNumber:      rowNumber,
		ResponseKey:          buildSubmittedFormResponseKey(timestamp, email, fullName, activityName),
		SubmittedAt:          submittedAt,
		RequestNumber:        requestNumber,
		FullName:             fullName,
		Email:                email,
		Whatsapp:             strings.TrimSpace(rowMap["Whatsapp"]),
		FullAddress:          strings.TrimSpace(rowMap["Alamat Lengkap"]),
		ActivityName:         activityName,
		ParticipantCount:     parseInt(rowMap["Jumlah Peserta"]),
		EventDate:            eventDate,
		EventTime:            strings.TrimSpace(rowMap["Waktu"]),
		Material:             strings.TrimSpace(rowMap["Materi"]),
		TrainingDuration:     strings.TrimSpace(rowMap["Durasi Pelatihan"]),
		AreaType:             strings.TrimSpace(rowMap["Jenis Area"]),
		EventLocationAddress: strings.TrimSpace(rowMap["Alamat Lengkap Lokasi Kegiatan"]),
		EmailAddress:         strings.TrimSpace(rowMap["Email Address"]),
		TrainingType:         strings.TrimSpace(rowMap["Jenis pelatihan"]),
		SheetStatus:          sheetStatus,
		LatestStatus:         latestStatus,
		RawPayloadJSON:       string(rawJSON),
		SyncedAt:             now,
		CreatedAt:            now,
		UpdatedAt:            &now,
	}, true, nil
}

func buildSubmittedFormResponseKey(parts ...string) string {
	normalizedParts := make([]string, 0, len(parts))
	for _, part := range parts {
		normalizedParts = append(normalizedParts, strings.TrimSpace(strings.ToLower(part)))
	}

	sum := sha1.Sum([]byte(strings.Join(normalizedParts, "|")))
	return hex.EncodeToString(sum[:])
}

func normalizeOverallStatus(raw string) string {
	normalized := strings.TrimSpace(strings.ToLower(raw))
	if normalized == "" {
		return "In progress"
	}

	switch normalized {
	case "complete", "completed", "approved", "approve", "done", "success":
		return "Approved"
	case "in progress", "pending", "pending approval", "processing", "submitted", "waiting approval":
		return "In progress"
	case "decline", "declined", "reject", "rejected", "cancelled", "canceled", "failed", "denied":
		return "Decline"
	}

	switch {
	case strings.Contains(normalized, "declin"),
		strings.Contains(normalized, "reject"),
		strings.Contains(normalized, "cancel"),
		strings.Contains(normalized, "fail"),
		strings.Contains(normalized, "denied"):
		return "Decline"
	case strings.Contains(normalized, "approv"),
		strings.Contains(normalized, "complete"),
		strings.Contains(normalized, "success"):
		return "Approved"
	default:
		// Unknown or newly introduced statuses should stay non-final by default.
		return "In progress"
	}
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

func buildLatestStatusMap(records []domainapprovalrecord.ApprovalRecord) map[int]string {
	type candidate struct {
		revision  int
		submitted time.Time
		status    string
	}

	result := make(map[int]candidate)
	for _, record := range records {
		if record.RequestNumber == 0 {
			continue
		}

		current, exists := result[record.RequestNumber]
		submittedAt := time.Time{}
		if record.SubmittedAt != nil {
			submittedAt = *record.SubmittedAt
		}

		if !exists || record.RevisionNumber > current.revision || (record.RevisionNumber == current.revision && submittedAt.After(current.submitted)) {
			result[record.RequestNumber] = candidate{
				revision:  record.RevisionNumber,
				submitted: submittedAt,
				status:    record.OverallStatus,
			}
		}
	}

	statusMap := make(map[int]string, len(result))
	for requestNumber, item := range result {
		statusMap[requestNumber] = item.status
	}
	return statusMap
}

func buildRowMap(headers, row []string) map[string]string {
	rowMap := make(map[string]string, len(headers))
	for i, header := range headers {
		key := strings.TrimSpace(header)
		if i < len(row) {
			rowMap[key] = strings.TrimSpace(row[i])
		} else {
			rowMap[key] = ""
		}
	}
	return rowMap
}

func parseOptionalTime(raw string) (*time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	layouts := []string{
		"1/2/2006 15:04:05",
		"1/2/2006 3:04:05 PM",
		"1/2/2006 15:04",
		"1/2/2006 3:04 PM",
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

func parseOptionalDate(raw string) (*time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	layouts := []string{
		"1/2/2006",
		"01/02/2006",
		"2006-01-02",
	}

	for _, layout := range layouts {
		if parsed, err := time.ParseInLocation(layout, raw, time.Local); err == nil {
			return &parsed, nil
		}
	}

	return nil, fmt.Errorf("unsupported date format: %s", raw)
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

func (s *ApprovalRecordService) getSheetURLConfig(configKey string) (domainappconfig.AppConfig, error) {
	if s.ConfigRepo == nil {
		return domainappconfig.AppConfig{}, gorm.ErrRecordNotFound
	}

	config, err := s.ConfigRepo.GetByKey(configKey)
	if err != nil {
		return domainappconfig.AppConfig{}, err
	}
	if !config.IsActive {
		return domainappconfig.AppConfig{}, errors.New("sheet URL config is inactive")
	}

	return config, nil
}

func (s *ApprovalRecordService) syncApprovalSheet(sheetURL string) ([]domainapprovalrecord.ApprovalRecord, int, int, int, error) {
	exportURL, err := buildSheetExportURL(sheetURL)
	if err != nil {
		return nil, 0, 0, 0, err
	}

	req, err := http.NewRequest(http.MethodGet, exportURL, nil)
	if err != nil {
		return nil, 0, 0, 0, err
	}

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, 0, 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, 0, 0, 0, fmt.Errorf("failed to fetch sheet CSV, status code: %d", resp.StatusCode)
	}

	reader := csv.NewReader(resp.Body)
	reader.FieldsPerRecord = -1

	headers, err := reader.Read()
	if err != nil {
		return nil, 0, 0, 0, err
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
			return nil, 0, 0, 0, err
		}

		rowNumber++
		rowMap := buildRowMap(headers, row)

		record, ok, err := buildApprovalRecord(rowNumber, rowMap)
		if err != nil {
			return nil, 0, 0, 0, err
		}
		if !ok {
			continue
		}

		records = append(records, record)
		responseIDs = append(responseIDs, record.ResponseID)
	}

	existing, err := s.Repo.GetExistingResponseIDs(responseIDs)
	if err != nil {
		return nil, 0, 0, 0, err
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
		return nil, 0, 0, 0, err
	}
	if err := s.Repo.RestoreByResponseIDs(responseIDs); err != nil {
		return nil, 0, 0, 0, err
	}
	if err := s.Repo.SoftDeleteMissing(responseIDs); err != nil {
		return nil, 0, 0, 0, err
	}

	return records, len(records), insertedRows, updatedRows, nil
}

func (s *ApprovalRecordService) syncSubmittedFormsSheet(
	sheetURL string,
	latestStatusMap map[int]string,
) ([]domainsubmittedform.SubmittedForm, int, int, int, error) {
	exportURL, err := buildSheetExportURL(sheetURL)
	if err != nil {
		return nil, 0, 0, 0, err
	}

	req, err := http.NewRequest(http.MethodGet, exportURL, nil)
	if err != nil {
		return nil, 0, 0, 0, err
	}

	resp, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, 0, 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, 0, 0, 0, fmt.Errorf("failed to fetch submitted forms CSV, status code: %d", resp.StatusCode)
	}

	reader := csv.NewReader(resp.Body)
	reader.FieldsPerRecord = -1

	headers, err := reader.Read()
	if err != nil {
		return nil, 0, 0, 0, err
	}

	forms := make([]domainsubmittedform.SubmittedForm, 0)
	responseKeys := make([]string, 0)
	rowNumber := 1

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, 0, 0, 0, err
		}

		rowNumber++
		rowMap := buildRowMap(headers, row)

		form, ok, err := buildSubmittedForm(rowNumber, rowMap, latestStatusMap)
		if err != nil {
			return nil, 0, 0, 0, err
		}
		if !ok {
			continue
		}

		forms = append(forms, form)
		responseKeys = append(responseKeys, form.ResponseKey)
	}

	existing, err := s.SubmittedFormRepo.GetExistingResponseKeys(responseKeys)
	if err != nil {
		return nil, 0, 0, 0, err
	}

	insertedRows := 0
	updatedRows := 0
	for _, form := range forms {
		if _, ok := existing[form.ResponseKey]; ok {
			updatedRows++
		} else {
			insertedRows++
		}
	}

	if err := s.SubmittedFormRepo.Upsert(forms); err != nil {
		return nil, 0, 0, 0, err
	}
	if err := s.SubmittedFormRepo.RestoreByResponseKeys(responseKeys); err != nil {
		return nil, 0, 0, 0, err
	}
	if err := s.SubmittedFormRepo.SoftDeleteMissing(responseKeys); err != nil {
		return nil, 0, 0, 0, err
	}

	return forms, len(forms), insertedRows, updatedRows, nil
}
