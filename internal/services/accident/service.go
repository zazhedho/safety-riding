package serviceaccident

import (
	"safety-riding/internal/domain/accident"
	"safety-riding/internal/dto"
	interfaceaccident "safety-riding/internal/interfaces/accident"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"time"
)

type AccidentService struct {
	AccidentRepo interfaceaccident.RepoAccidentInterface
}

func NewAccidentService(accidentRepo interfaceaccident.RepoAccidentInterface) *AccidentService {
	return &AccidentService{
		AccidentRepo: accidentRepo,
	}
}

func (s *AccidentService) AddAccident(username string, req dto.AddAccident) (domainaccident.Accident, error) {
	data := domainaccident.Accident{
		ID:                utils.CreateUUID(),
		PoliceReportNo:    req.PoliceReportNo,
		AccidentDate:      req.AccidentDate,
		AccidentTime:      req.AccidentTime,
		Location:          req.Location,
		DistrictId:        req.DistrictId,
		CityId:            req.CityId,
		ProvinceId:        req.ProvinceId,
		Latitude:          req.Latitude,
		Longitude:         req.Longitude,
		RoadType:          req.RoadType,
		WeatherCondition:  req.WeatherCondition,
		RoadCondition:     req.RoadCondition,
		VehicleType:       req.VehicleType,
		AccidentType:      req.AccidentType,
		DeathCount:        req.DeathCount,
		InjuredCount:      req.InjuredCount,
		MinorInjuredCount: req.MinorInjuredCount,
		VehicleCount:      req.VehicleCount,
		CauseOfAccident:   req.CauseOfAccident,
		Description:       req.Description,
		PoliceStation:     req.PoliceStation,
		OfficerName:       req.OfficerName,
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
	if req.CityId != "" {
		accident.CityId = req.CityId
	}
	if req.ProvinceId != "" {
		accident.ProvinceId = req.ProvinceId
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
