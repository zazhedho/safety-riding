package dto

type OTPSendRequest struct {
	Email string `json:"email" binding:"required,email"`
}
