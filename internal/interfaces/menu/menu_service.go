package interfacemenu

import (
	domainmenu "safety-riding/internal/domain/menu"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceMenuInterface interface {
	Create(req dto.MenuItemCreate) (domainmenu.MenuItem, error)
	GetByID(id string) (domainmenu.MenuItem, error)
	GetAll(params filter.BaseParams) ([]domainmenu.MenuItem, int64, error)
	GetActiveMenus() ([]domainmenu.MenuItem, error)
	GetUserMenus(userId string) ([]domainmenu.MenuItem, error)
	Update(id string, req dto.MenuItemUpdate) (domainmenu.MenuItem, error)
	Delete(id string) error
}
