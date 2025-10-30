package dto

type AssignMechanic struct {
	MechanicID string `json:"mechanic_id" binding:"required,uuid"`
}

type UpdateStatus struct {
	Status string `json:"status" binding:"required"`
}
