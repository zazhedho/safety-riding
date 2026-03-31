package servicemenu

import (
	"errors"
	"safety-riding/internal/domain/menu"
	"safety-riding/internal/dto"
	"safety-riding/internal/interfaces/menu"
	interfacepermission "safety-riding/internal/interfaces/permission"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"time"
)

type MenuService struct {
	MenuRepo       interfacemenu.RepoMenuInterface
	PermissionRepo interfacepermission.RepoPermissionInterface
}

func NewMenuService(
	menuRepo interfacemenu.RepoMenuInterface,
	permissionRepo interfacepermission.RepoPermissionInterface,
) *MenuService {
	return &MenuService{
		MenuRepo:       menuRepo,
		PermissionRepo: permissionRepo,
	}
}

func (s *MenuService) Create(req dto.MenuItemCreate) (domainmenu.MenuItem, error) {
	// Check if menu with same name already exists
	existing, _ := s.MenuRepo.GetByName(req.Name)
	if existing.Id != "" {
		return domainmenu.MenuItem{}, errors.New("menu item with this name already exists")
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	data := domainmenu.MenuItem{
		Id:          utils.CreateUUID(),
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Path:        req.Path,
		Icon:        req.Icon,
		ParentId:    req.ParentId,
		OrderIndex:  req.OrderIndex,
		IsActive:    isActive,
		CreatedAt:   time.Now(),
	}

	if err := s.MenuRepo.Store(data); err != nil {
		return domainmenu.MenuItem{}, err
	}

	return data, nil
}

func (s *MenuService) GetByID(id string) (domainmenu.MenuItem, error) {
	return s.MenuRepo.GetByID(id)
}

func (s *MenuService) GetAll(params filter.BaseParams) ([]domainmenu.MenuItem, int64, error) {
	return s.MenuRepo.GetAll(params)
}

func (s *MenuService) GetActiveMenus() ([]domainmenu.MenuItem, error) {
	return s.MenuRepo.GetActiveMenus()
}

func (s *MenuService) GetUserMenus(userId string, userRole string) ([]domainmenu.MenuItem, error) {
	menus, err := s.MenuRepo.GetActiveMenus()
	if err != nil {
		return nil, err
	}

	if userRole == utils.RoleSuperAdmin {
		return menus, nil
	}

	permissions, err := s.PermissionRepo.GetUserPermissions(userId)
	if err != nil {
		return nil, err
	}

	allowedResources := make(map[string]struct{}, len(permissions))
	for _, permission := range permissions {
		allowedResources[permission.Resource] = struct{}{}
	}

	menuMap := make(map[string]domainmenu.MenuItem, len(menus))
	allowedMenuIDs := make(map[string]struct{})

	for _, menu := range menus {
		menuMap[menu.Id] = menu
		if canAccessMenu(menu, allowedResources) {
			allowedMenuIDs[menu.Id] = struct{}{}
			includeParentMenus(menu, menuMap, allowedMenuIDs)
		}
	}

	filtered := make([]domainmenu.MenuItem, 0, len(allowedMenuIDs))
	for _, menu := range menus {
		if _, ok := allowedMenuIDs[menu.Id]; ok {
			filtered = append(filtered, menu)
		}
	}

	return filtered, nil
}

func (s *MenuService) Update(id string, req dto.MenuItemUpdate) (domainmenu.MenuItem, error) {
	menuItem, err := s.MenuRepo.GetByID(id)
	if err != nil {
		return domainmenu.MenuItem{}, err
	}

	// Update only provided fields
	if req.DisplayName != "" {
		menuItem.DisplayName = req.DisplayName
	}
	if req.Path != "" {
		menuItem.Path = req.Path
	}
	menuItem.Icon = req.Icon
	if req.ParentId != nil {
		menuItem.ParentId = req.ParentId
	}
	if req.OrderIndex != nil {
		menuItem.OrderIndex = *req.OrderIndex
	}
	if req.IsActive != nil {
		menuItem.IsActive = *req.IsActive
	}
	now := time.Now()
	menuItem.UpdatedAt = &now

	if err := s.MenuRepo.Update(menuItem); err != nil {
		return domainmenu.MenuItem{}, err
	}

	return menuItem, nil
}

func (s *MenuService) Delete(id string) error {
	return s.MenuRepo.Delete(id)
}

var _ interfacemenu.ServiceMenuInterface = (*MenuService)(nil)

func canAccessMenu(menu domainmenu.MenuItem, allowedResources map[string]struct{}) bool {
	for _, resource := range menuResources(menu) {
		if _, ok := allowedResources[resource]; ok {
			return true
		}
	}

	return false
}

func includeParentMenus(
	menu domainmenu.MenuItem,
	menuMap map[string]domainmenu.MenuItem,
	allowedMenuIDs map[string]struct{},
) {
	current := menu
	for current.ParentId != nil && *current.ParentId != "" {
		parent, ok := menuMap[*current.ParentId]
		if !ok {
			return
		}

		if _, exists := allowedMenuIDs[parent.Id]; exists {
			return
		}

		allowedMenuIDs[parent.Id] = struct{}{}
		current = parent
	}
}

func menuResources(menu domainmenu.MenuItem) []string {
	switch menu.Name {
	case "marketshare":
		return []string{"market_shares"}
	case "submit_case_ahass":
		return []string{"accidents"}
	case "polda_accidents":
		return []string{"polda_accidents"}
	case "education":
		return nil
	case "accidents":
		return []string{"accidents", "polda_accidents"}
	default:
		return []string{menu.Name}
	}
}
