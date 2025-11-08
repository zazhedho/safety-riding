package serviceaccident

import (
	"context"
	"fmt"
	"mime/multipart"
	"safety-riding/internal/domain/accident"
	"safety-riding/internal/dto"
	interfaceaccident "safety-riding/internal/interfaces/accident"
	"safety-riding/pkg/filter"
	"safety-riding/pkg/storage"
	"safety-riding/utils"
	"strconv"
	"time"
)

type AccidentService struct {
	AccidentRepo    interfaceaccident.RepoAccidentInterface
	StorageProvider storage.StorageProvider
}

func NewAccidentService(accidentRepo interfaceaccident.RepoAccidentInterface, storageProvider storage.StorageProvider) *AccidentService {
	return &AccidentService{
		AccidentRepo:    accidentRepo,
		StorageProvider: storageProvider,
	}
}

func (s *AccidentService) AddAccident(username string, req dto.AddAccident) (domainaccident.Accident, error) {
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"death_count":         req.DeathCount,
		"injured_count":       req.InjuredCount,
		"minor_injured_count": req.MinorInjuredCount,
		"vehicle_count":       req.VehicleCount,
	}); err != nil {
		return domainaccident.Accident{}, err
	}

	data := domainaccident.Accident{
		ID:                utils.CreateUUID(),
		PoliceReportNo:    req.PoliceReportNo,
		AccidentDate:      req.AccidentDate,
		AccidentTime:      req.AccidentTime,
		Location:          utils.TitleCase(req.Location),
		DistrictId:        req.DistrictId,
		DistrictName:      req.DistrictName,
		CityId:            req.CityId,
		CityName:          req.CityName,
		ProvinceId:        req.ProvinceId,
		ProvinceName:      req.ProvinceName,
		Latitude:          req.Latitude,
		Longitude:         req.Longitude,
		RoadType:          utils.TitleCase(req.RoadType),
		WeatherCondition:  utils.TitleCase(req.WeatherCondition),
		RoadCondition:     utils.TitleCase(req.RoadCondition),
		VehicleType:       utils.TitleCase(req.VehicleType),
		AccidentType:      utils.TitleCase(req.AccidentType),
		DeathCount:        req.DeathCount,
		InjuredCount:      req.InjuredCount,
		MinorInjuredCount: req.MinorInjuredCount,
		VehicleCount:      req.VehicleCount,
		CauseOfAccident:   req.CauseOfAccident,
		Description:       req.Description,
		PoliceStation:     req.PoliceStation,
		OfficerName:       utils.TitleCase(req.OfficerName),
		CreatedAt:         time.Now(),
		CreatedBy:         username,
	}

	if err := s.AccidentRepo.Create(data); err != nil {
		return domainaccident.Accident{}, err
	}

	return data, nil
}

func (s *AccidentService) GetAccidentById(id string) (domainaccident.Accident, error) {
	return s.AccidentRepo.GetByID(id)
}

func (s *AccidentService) UpdateAccident(id, username string, req dto.UpdateAccident) (domainaccident.Accident, error) {
	if err := utils.ValidateNonNegativeBatch(map[string]interface{}{
		"death_count":         req.DeathCount,
		"injured_count":       req.InjuredCount,
		"minor_injured_count": req.MinorInjuredCount,
		"vehicle_count":       req.VehicleCount,
	}); err != nil {
		return domainaccident.Accident{}, err
	}

	// Get existing accident
	accident, err := s.AccidentRepo.GetByID(id)
	if err != nil {
		return domainaccident.Accident{}, err
	}

	// Update fields if provided
	if req.PoliceReportNo != "" {
		accident.PoliceReportNo = req.PoliceReportNo
	}
	if req.AccidentDate != "" {
		accident.AccidentDate = req.AccidentDate
	}
	if req.AccidentTime != "" {
		accident.AccidentTime = req.AccidentTime
	}
	if req.Location != "" {
		accident.Location = req.Location
	}
	if req.DistrictId != "" {
		accident.DistrictId = req.DistrictId
	}
	if req.DistrictName != "" {
		accident.DistrictName = req.DistrictName
	}
	if req.CityId != "" {
		accident.CityId = req.CityId
	}
	if req.CityName != "" {
		accident.CityName = req.CityName
	}
	if req.ProvinceId != "" {
		accident.ProvinceId = req.ProvinceId
	}
	if req.ProvinceName != "" {
		accident.ProvinceName = req.ProvinceName
	}
	if req.Latitude != 0 {
		accident.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		accident.Longitude = req.Longitude
	}
	if req.RoadType != "" {
		accident.RoadType = req.RoadType
	}
	if req.WeatherCondition != "" {
		accident.WeatherCondition = req.WeatherCondition
	}
	if req.RoadCondition != "" {
		accident.RoadCondition = req.RoadCondition
	}
	if req.VehicleType != "" {
		accident.VehicleType = req.VehicleType
	}
	if req.AccidentType != "" {
		accident.AccidentType = req.AccidentType
	}
	if req.DeathCount != 0 {
		accident.DeathCount = req.DeathCount
	}
	if req.InjuredCount != 0 {
		accident.InjuredCount = req.InjuredCount
	}
	if req.MinorInjuredCount != 0 {
		accident.MinorInjuredCount = req.MinorInjuredCount
	}
	if req.VehicleCount != 0 {
		accident.VehicleCount = req.VehicleCount
	}
	if req.CauseOfAccident != "" {
		accident.CauseOfAccident = req.CauseOfAccident
	}
	if req.Description != "" {
		accident.Description = req.Description
	}
	if req.PoliceStation != "" {
		accident.PoliceStation = req.PoliceStation
	}
	if req.OfficerName != "" {
		accident.OfficerName = req.OfficerName
	}

	accident.UpdatedAt = time.Now()
	accident.UpdatedBy = username

	if err := s.AccidentRepo.Update(accident); err != nil {
		return domainaccident.Accident{}, err
	}

	return accident, nil
}

func (s *AccidentService) FetchAccident(params filter.BaseParams) ([]domainaccident.Accident, int64, error) {
	return s.AccidentRepo.Fetch(params)
}

func (s *AccidentService) DeleteAccident(id, username string) error {
	// Check if accident exists
	accident, err := s.AccidentRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Update deleted fields
	accident.DeletedBy = username

	// Soft delete
	if err := s.AccidentRepo.Delete(id); err != nil {
		return err
	}

	return nil
}

// Photo methods
func (s *AccidentService) AddAccidentPhotos(accidentId, username string, photos []dto.AddAccidentPhoto) ([]domainaccident.AccidentPhoto, error) {
	// Verify accident exists
	accident, err := s.AccidentRepo.GetByID(accidentId)
	if err != nil {
		return nil, err
	}

	maxAccidentPhotos := utils.GetEnv("MAX_ACCIDENT_PHOTOS", 4).(int)
	if err := utils.ValidatePhotoLimit(len(accident.Photos), len(photos), maxAccidentPhotos); err != nil {
		return nil, err
	}

	accidentPhotos := make([]domainaccident.AccidentPhoto, 0, len(photos))
	for _, p := range photos {
		accidentPhotos = append(accidentPhotos, domainaccident.AccidentPhoto{
			ID:         utils.CreateUUID(),
			AccidentId: accidentId,
			PhotoUrl:   p.PhotoUrl,
			Caption:    p.Caption,
			PhotoOrder: p.PhotoOrder,
			CreatedAt:  time.Now(),
			CreatedBy:  username,
		})
	}

	if err := s.AccidentRepo.AddPhotos(accidentPhotos); err != nil {
		return nil, err
	}

	return accidentPhotos, nil
}

func (s *AccidentService) DeleteAccidentPhoto(photoId, username string) error {
	accidentPhoto, err := s.AccidentRepo.GetPhotoByID(photoId)
	if err != nil {
		return err
	}

	if err = s.AccidentRepo.DeletePhoto(photoId); err == nil {
		_ = s.StorageProvider.DeleteFile(context.Background(), accidentPhoto.PhotoUrl)
	}

	return err
}

// AddAccidentPhotosFromFiles uploads photos to storage and saves to database
func (s *AccidentService) AddAccidentPhotosFromFiles(ctx context.Context, accidentId, username string, files []*multipart.FileHeader, captions []string, photoOrders []string) ([]domainaccident.AccidentPhoto, error) {
	// Verify accident exists
	accident, err := s.AccidentRepo.GetByID(accidentId)
	if err != nil {
		return nil, err
	}

	maxAccidentPhotos := utils.GetEnv("MAX_ACCIDENT_PHOTOS", 4).(int)
	if err := utils.ValidatePhotoLimit(len(accident.Photos), len(files), maxAccidentPhotos); err != nil {
		return nil, err
	}

	accidentPhotos := make([]domainaccident.AccidentPhoto, 0, len(files))

	var photoURL string
	for i, fileHeader := range files {
		if err := utils.ValidatePhotoFileSize(fileHeader); err != nil {
			return nil, err
		}

		// Open file
		file, err := fileHeader.Open()
		if err != nil {
			return nil, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
		}
		defer file.Close()

		// Upload to storage provider (MinIO or R2)
		photoURL, err = s.StorageProvider.UploadFile(ctx, file, fileHeader, "accident-photos")
		if err != nil {
			return nil, fmt.Errorf("failed to upload file %s to storage: %w", fileHeader.Filename, err)
		}

		// Get caption if provided
		caption := ""
		if i < len(captions) {
			caption = captions[i]
		}

		// Get photo order if provided
		photoOrder := 0
		if i < len(photoOrders) {
			if order, err := strconv.Atoi(photoOrders[i]); err == nil {
				photoOrder = order
			}
		}

		// Create photo record
		accidentPhoto := domainaccident.AccidentPhoto{
			ID:         utils.CreateUUID(),
			AccidentId: accidentId,
			PhotoUrl:   photoURL,
			Caption:    caption,
			PhotoOrder: photoOrder,
			CreatedAt:  time.Now(),
			CreatedBy:  username,
		}

		accidentPhotos = append(accidentPhotos, accidentPhoto)
	}

	// Save photos to database
	if err := s.AccidentRepo.AddPhotos(accidentPhotos); err != nil {
		_ = s.StorageProvider.DeleteFile(ctx, photoURL)
		return nil, err
	}

	return accidentPhotos, nil
}
