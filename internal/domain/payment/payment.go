package payment

import "time"

type Payment struct {
	ID        string    `json:"id"`
	InvoiceID string    `json:"invoice_id"`
	Method    string    `json:"method"` // cash, transfer, e-wallet
	Amount    float64   `json:"amount"`
	PaidAt    time.Time `json:"paid_at"`
	CreatedAt time.Time `json:"created_at"`
}
