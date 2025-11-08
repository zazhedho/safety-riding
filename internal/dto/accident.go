package dto

type AddAccident struct {
	PoliceReportNo    string  `json:"police_report_no" binding:"required"`
	AccidentDate      string  `json:"accident_date" binding:"required"`
	AccidentTime      string  `json:"accident_time" binding:"required"`
	Location          string  `json:"location" binding:"required,min=5,max=255"`
	DistrictId        string  `json:"district_id" binding:"required"`
	DistrictName      string  `json:"district_name" binding:"required"`
	CityId            string  `json:"city_id" binding:"required"`
	CityName          string  `json:"city_name" binding:"required"`
	ProvinceId        string  `json:"province_id" binding:"required"`
	ProvinceName      string  `json:"province_name" binding:"required"`
	Latitude          float64 `json:"latitude,omitempty"`
	Longitude         float64 `json:"longitude,omitempty"`
	RoadType          string  `json:"road_type,omitempty"`
	WeatherCondition  string  `json:"weather_condition,omitempty"`
	RoadCondition     string  `json:"road_condition,omitempty"`
	VehicleType       string  `json:"vehicle_type" binding:"required"`
	AccidentType      string  `json:"accident_type" binding:"required"`
	DeathCount        int     `json:"death_count,omitempty"`
	InjuredCount      int     `json:"injured_count,omitempty"`
	MinorInjuredCount int     `json:"minor_injured_count,omitempty"`
	VehicleCount      int     `json:"vehicle_count,omitempty"`
	CauseOfAccident   string  `json:"cause_of_accident,omitempty"`
	Description       string  `json:"description,omitempty"`
	PoliceStation     string  `json:"police_station,omitempty"`
	OfficerName       string  `json:"officer_name,omitempty"`
}

type UpdateAccident struct {
	PoliceReportNo    string  `json:"police_report_no,omitempty"`
	AccidentDate      string  `json:"accident_date,omitempty"`
	AccidentTime      string  `json:"accident_time,omitempty"`
	Location          string  `json:"location,omitempty"`
	DistrictId        string  `json:"district_id,omitempty"`
	DistrictName      string  `json:"district_name,omitempty"`
	CityId            string  `json:"city_id,omitempty"`
	CityName          string  `json:"city_name,omitempty"`
	ProvinceId        string  `json:"province_id,omitempty"`
	ProvinceName      string  `json:"province_name,omitempty"`
	Latitude          float64 `json:"latitude,omitempty"`
	Longitude         float64 `json:"longitude,omitempty"`
	RoadType          string  `json:"road_type,omitempty"`
	WeatherCondition  string  `json:"weather_condition,omitempty"`
	RoadCondition     string  `json:"road_condition,omitempty"`
	VehicleType       string  `json:"vehicle_type,omitempty"`
	AccidentType      string  `json:"accident_type,omitempty"`
	DeathCount        int     `json:"death_count,omitempty"`
	InjuredCount      int     `json:"injured_count,omitempty"`
	MinorInjuredCount int     `json:"minor_injured_count,omitempty"`
	VehicleCount      int     `json:"vehicle_count,omitempty"`
	CauseOfAccident   string  `json:"cause_of_accident,omitempty"`
	Description       string  `json:"description,omitempty"`
	PoliceStation     string  `json:"police_station,omitempty"`
	OfficerName       string  `json:"officer_name,omitempty"`
}

type AddAccidentPhoto struct {
	PhotoUrl   string `json:"photo_url" binding:"required"`
	Caption    string `json:"caption,omitempty"`
	PhotoOrder int    `json:"photo_order,omitempty"`
}
