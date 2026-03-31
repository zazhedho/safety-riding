package interfacesubmittedform

import (
	domainsubmittedform "safety-riding/internal/domain/submittedform"
	"safety-riding/pkg/filter"
	"time"
)

type RepoSubmittedFormInterface interface {
	Fetch(params filter.BaseParams) ([]domainsubmittedform.SubmittedForm, int64, error)
	GetByID(id string) (domainsubmittedform.SubmittedForm, error)
	GetLatestSyncedAt() (*time.Time, error)
	GetExistingResponseKeys(responseKeys []string) (map[string]struct{}, error)
	RestoreByResponseKeys(responseKeys []string) error
	SoftDeleteMissing(responseKeys []string) error
	Upsert(forms []domainsubmittedform.SubmittedForm) error
}
