package vehicle

import (
	"strings"
	"time"
	"workshop-management/internal/domain/vehicle"
	"workshop-management/internal/dto"
	"workshop-management/pkg/filter"
	"workshop-management/utils"
)

type ServiceVehicle struct {
	VehicleRepo vehicle.RepoVehicle
}

func NewVehicleService(vehicleRepo vehicle.RepoVehicle) *ServiceVehicle {
	return &ServiceVehicle{
		VehicleRepo: vehicleRepo,
	}
}

func (s *ServiceVehicle) Create(userId string, req dto.AddVehicle) (vehicle.Vehicle, error) {
	data := vehicle.Vehicle{
		Id:           utils.CreateUUID(),
		UserId:       userId,
		Brand:        strings.ToUpper(req.Brand),
		Model:        utils.TitleCase(req.Model),
		Year:         req.Year,
		Color:        utils.TitleCase(req.Color),
		LicensePlate: strings.ToUpper(req.LicensePlate),
		CreatedAt:    time.Now(),
	}

	if err := s.VehicleRepo.Store(data); err != nil {
		return vehicle.Vehicle{}, err
	}

	return data, nil
}

func (s *ServiceVehicle) GetById(id string) (vehicle.Vehicle, error) {
	return s.VehicleRepo.GetById(id)
}

func (s *ServiceVehicle) Fetch(params filter.BaseParams) ([]vehicle.Vehicle, int64, error) {
	return s.VehicleRepo.Fetch(params)
}

func (s *ServiceVehicle) Update(id, userId string, req dto.UpdateVehicle) (int64, error) {
	data := vehicle.Vehicle{
		Brand:        strings.ToUpper(req.Brand),
		Model:        utils.TitleCase(req.Model),
		Year:         req.Year,
		Color:        utils.TitleCase(req.Color),
		LicensePlate: strings.ToUpper(req.LicensePlate),
		UpdatedBy:    userId,
		UpdatedAt:    time.Now(),
	}

	return s.VehicleRepo.Update(vehicle.Vehicle{Id: id}, data)
}

func (s *ServiceVehicle) Delete(id, userId string) error {
	data := map[string]interface{}{
		"deleted_by": userId,
		"deleted_at": time.Now(),
	}

	return s.VehicleRepo.Delete(vehicle.Vehicle{Id: id}, data)
}
