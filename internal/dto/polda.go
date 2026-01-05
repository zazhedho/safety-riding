package dto

type CreatePoldaAccidentRequest struct {
	PoliceUnit        string `json:"police_unit" validate:"required"`
	TotalAccidents    int    `json:"total_accidents" validate:"min=0"`
	TotalDeaths       int    `json:"total_deaths" validate:"min=0"`
	TotalSevereInjury int    `json:"total_severe_injury" validate:"min=0"`
	TotalMinorInjury  int    `json:"total_minor_injury" validate:"min=0"`
	Period            string `json:"period" validate:"required"`
	CityId            string `json:"city_id" validate:"required"`
	CityName          string `json:"city_name"`
	ProvinceId        string `json:"province_id" validate:"required"`
	ProvinceName      string `json:"province_name"`
}

type UpdatePoldaAccidentRequest struct {
	PoliceUnit        string `json:"police_unit"`
	TotalAccidents    int    `json:"total_accidents" validate:"min=0"`
	TotalDeaths       int    `json:"total_deaths" validate:"min=0"`
	TotalSevereInjury int    `json:"total_severe_injury" validate:"min=0"`
	TotalMinorInjury  int    `json:"total_minor_injury" validate:"min=0"`
	Period            string `json:"period"`
	CityId            string `json:"city_id"`
	CityName          string `json:"city_name"`
	ProvinceId        string `json:"province_id"`
	ProvinceName      string `json:"province_name"`
}

type PoldaAccidentResponse struct {
	ID                string `json:"id"`
	PoliceUnit        string `json:"police_unit"`
	TotalAccidents    int    `json:"total_accidents"`
	TotalDeaths       int    `json:"total_deaths"`
	TotalSevereInjury int    `json:"total_severe_injury"`
	TotalMinorInjury  int    `json:"total_minor_injury"`
	Period            string `json:"period"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
}
