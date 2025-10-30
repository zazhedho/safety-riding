package dto

type AddVehicle struct {
	Brand        string `json:"brand" binding:"required"`
	Model        string `json:"model" binding:"required"`
	Year         string `json:"year" binding:"required,min=4,max=5"`
	LicensePlate string `json:"license_plate" binding:"required,min=3,max=10"`
	Color        string `json:"color" binding:"required"`
}

type UpdateVehicle struct {
	Brand        string `json:"brand"`
	Model        string `json:"model"`
	Year         string `json:"year" binding:"omitempty,min=4,max=5"`
	Color        string `json:"color"`
	LicensePlate string `json:"license_plate" binding:"omitempty,min=3,max=10"`
}
