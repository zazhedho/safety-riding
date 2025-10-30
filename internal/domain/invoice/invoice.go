package invoice

import "time"

type Invoice struct {
	ID          string    `json:"id"`
	WorkOrderID string    `json:"work_order_id"`
	Total       float64   `json:"total"`
	Status      string    `json:"status"` // pending, paid, cancelled
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
