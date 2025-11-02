package interfacemenu

import (
	"safety-riding/internal/domain/menu"
	"safety-riding/pkg/filter"
)

type RepoMenuInterface interface {
	Store(m domainmenu.MenuItem) error
	GetByID(id string) (domainmenu.MenuItem, error)
	GetByName(name string) (domainmenu.MenuItem, error)
	GetAll(params filter.BaseParams) ([]domainmenu.MenuItem, int64, error)
	Update(m domainmenu.MenuItem) error
	Delete(id string) error

	// Get active menus ordered by order_index
	GetActiveMenus() ([]domainmenu.MenuItem, error)

	// Get user menus (through role)
	GetUserMenus(userId string) ([]domainmenu.MenuItem, error)
}
