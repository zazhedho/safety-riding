package interfaceaccident

import (
	"context"
	"mime/multipart"

	domainaccident "safety-riding/internal/domain/accident"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceAccidentInterface interface {
	AddAccident(username string, req dto.AddAccident) (domainaccident.Accident, error)
	GetAccidentById(id string) (domainaccident.Accident, error)
	UpdateAccident(id, username string, req dto.UpdateAccident) (domainaccident.Accident, error)
	FetchAccident(params filter.BaseParams) ([]domainaccident.Accident, int64, error)
	DeleteAccident(id, username string) error
	AddAccidentPhotos(accidentId, username string, photos []dto.AddAccidentPhoto) ([]domainaccident.AccidentPhoto, error)
	DeleteAccidentPhoto(photoId, username string) error
	AddAccidentPhotosFromFiles(ctx context.Context, accidentId, username string, files []*multipart.FileHeader, captions []string, photoOrders []string) ([]domainaccident.AccidentPhoto, error)
}
