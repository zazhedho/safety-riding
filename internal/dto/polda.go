package dto

type CreatePoldaAccidentRequest struct {
	PoliceUnit        string `json:"police_unit" validate:"required"`
	TotalAccidents    int    `json:"total_accidents" validate:"required,min=0"`
	TotalDeaths       int    `json:"total_deaths" validate:"required,min=0"`
	TotalSevereInjury int    `json:"total_severe_injury" validate:"required,min=0"`
	TotalMinorInjury  int    `json:"total_minor_injury" validate:"required,min=0"`
	Period            string `json:"period" validate:"required"`
}

type UpdatePoldaAccidentRequest struct {
	PoliceUnit        string `json:"police_unit"`
	TotalAccidents    int    `json:"total_accidents" validate:"min=0"`
	TotalDeaths       int    `json:"total_deaths" validate:"min=0"`
	TotalSevereInjury int    `json:"total_severe_injury" validate:"min=0"`
	TotalMinorInjury  int    `json:"total_minor_injury" validate:"min=0"`
	Period            string `json:"period"`
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
