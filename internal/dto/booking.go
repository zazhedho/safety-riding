package dto

import "time"

type CreateBooking struct {
	VehicleID   string    `json:"vehicle_id" binding:"required"`
	BookingDate time.Time `json:"booking_date" binding:"required"`
	Notes       string    `json:"notes"`
	ServiceIDs  []string  `json:"service_ids" binding:"required"`
}

type UpdateBooking struct {
	BookingDate time.Time `json:"booking_date"`
	Notes       string    `json:"notes"`
	ServiceIDs  []string  `json:"service_ids"`
	Status      string    `json:"status"`
}

type UpdateBookingStatus struct {
	Status string `json:"status" binding:"required"`
}
