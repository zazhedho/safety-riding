package dto

type AddEvent struct {
	SchoolId                 string              `json:"school_id,omitempty"`
	PublicId                 string              `json:"public_id,omitempty"`
	Title                    string              `json:"title" binding:"required,min=3,max=200"`
	Description              string              `json:"description" binding:"required"`
	EventDate                string              `json:"event_date" binding:"required"`
	StartTime                string              `json:"start_time" binding:"required"`
	EndTime                  string              `json:"end_time" binding:"required"`
	Location                 string              `json:"location" binding:"required"`
	DistrictId               string              `json:"district_id" binding:"required"`
	CityId                   string              `json:"city_id" binding:"required"`
	ProvinceId               string              `json:"province_id" binding:"required"`
	EventType                string              `json:"event_type" binding:"required"`
	TargetAudience           string              `json:"target_audience,omitempty"`
	TargetAttendees          int                 `json:"target_attendees,omitempty"`
	AttendeesCount           int                 `json:"attendees_count,omitempty"`
	OnTheSpotSales           []OnTheSpotSaleItem `json:"on_the_spot_sales,omitempty"`
	VisitingServiceUnitEntry int                 `json:"visiting_service_unit_entry,omitempty"`
	VisitingServiceProfit    float64             `json:"visiting_service_profit,omitempty"`
	InstructorName           string              `json:"instructor_name,omitempty"`
	InstructorPhone          string              `json:"instructor_phone,omitempty"`
	Status                   string              `json:"status,omitempty"`
	Notes                    string              `json:"notes,omitempty"`
	Photos                   []AddEventPhoto     `json:"photos,omitempty"`
}

type UpdateEvent struct {
	SchoolId                 string              `json:"school_id,omitempty"`
	PublicId                 string              `json:"public_id,omitempty"`
	Title                    string              `json:"title,omitempty"`
	Description              string              `json:"description,omitempty"`
	EventDate                string              `json:"event_date,omitempty"`
	StartTime                string              `json:"start_time,omitempty"`
	EndTime                  string              `json:"end_time,omitempty"`
	Location                 string              `json:"location,omitempty"`
	DistrictId               string              `json:"district_id,omitempty"`
	CityId                   string              `json:"city_id,omitempty"`
	ProvinceId               string              `json:"province_id,omitempty"`
	EventType                string              `json:"event_type,omitempty"`
	TargetAudience           string              `json:"target_audience,omitempty"`
	TargetAttendees          int                 `json:"target_attendees,omitempty"`
	AttendeesCount           int                 `json:"attendees_count,omitempty"`
	OnTheSpotSales           []OnTheSpotSaleItem `json:"on_the_spot_sales,omitempty"`
	VisitingServiceUnitEntry int                 `json:"visiting_service_unit_entry,omitempty"`
	VisitingServiceProfit    float64             `json:"visiting_service_profit,omitempty"`
	InstructorName           string              `json:"instructor_name,omitempty"`
	InstructorPhone          string              `json:"instructor_phone,omitempty"`
	Status                   string              `json:"status,omitempty"`
	Notes                    string              `json:"notes,omitempty"`
}

type OnTheSpotSaleItem struct {
	VehicleType   string `json:"vehicle_type"`
	PaymentMethod string `json:"payment_method"`
	Quantity      int    `json:"quantity"`
}

type AddEventPhoto struct {
	PhotoUrl   string `json:"photo_url" binding:"required"`
	Caption    string `json:"caption,omitempty"`
	PhotoOrder int    `json:"photo_order,omitempty"`
}

type UpdateEventPhoto struct {
	ID         string `json:"id" binding:"required"`
	PhotoUrl   string `json:"photo_url,omitempty"`
	Caption    string `json:"caption,omitempty"`
	PhotoOrder int    `json:"photo_order,omitempty"`
}
