package interfaceaccident

import (
	domainaccident "safety-riding/internal/domain/accident"
	"safety-riding/pkg/filter"
)

type RepoAccidentInterface interface {
	Create(accident domainaccident.Accident) error
	GetByID(id string) (domainaccident.Accident, error)
	Update(accident domainaccident.Accident) error
	Fetch(params filter.BaseParams) ([]domainaccident.Accident, int64, error)
	Delete(id string) error

	// Accident Photo methods
	AddPhotos(photos []domainaccident.AccidentPhoto) error
	GetPhotosByAccidentID(accidentId string) ([]domainaccident.AccidentPhoto, error)
	GetPhotoByID(photoId string) (domainaccident.AccidentPhoto, error)
	DeletePhoto(photoId string) error
	DeletePhotosByAccidentID(accidentId string) error
}
