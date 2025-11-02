package dto

type MenuItemCreate struct {
	Name        string  `json:"name" binding:"required,min=3,max=50"`
	DisplayName string  `json:"display_name" binding:"required,min=3,max=100"`
	Path        string  `json:"path" binding:"required,min=1,max=255"`
	Icon        string  `json:"icon" binding:"omitempty,max=50"`
	ParentId    *string `json:"parent_id" binding:"omitempty"`
	OrderIndex  int     `json:"order_index" binding:"omitempty,min=0"`
	IsActive    *bool   `json:"is_active" binding:"omitempty"`
}

type MenuItemUpdate struct {
	DisplayName string  `json:"display_name" binding:"omitempty,min=3,max=100"`
	Path        string  `json:"path" binding:"omitempty,min=1,max=255"`
	Icon        string  `json:"icon" binding:"omitempty,max=50"`
	ParentId    *string `json:"parent_id" binding:"omitempty"`
	OrderIndex  *int    `json:"order_index" binding:"omitempty,min=0"`
	IsActive    *bool   `json:"is_active" binding:"omitempty"`
}
