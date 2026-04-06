package servicerole

import (
	"errors"
	domainmenu "safety-riding/internal/domain/menu"
	domainpermission "safety-riding/internal/domain/permission"
	"safety-riding/internal/domain/role"
	"safety-riding/internal/dto"
	"safety-riding/internal/interfaces/menu"
	"safety-riding/internal/interfaces/permission"
	"safety-riding/internal/interfaces/role"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"time"
)

type RoleService struct {
	RoleRepo       interfacerole.RepoRoleInterface
	PermissionRepo interfacepermission.RepoPermissionInterface
	MenuRepo       interfacemenu.RepoMenuInterface
}

func NewRoleService(
	roleRepo interfacerole.RepoRoleInterface,
	permissionRepo interfacepermission.RepoPermissionInterface,
	menuRepo interfacemenu.RepoMenuInterface,
) *RoleService {
	return &RoleService{
		RoleRepo:       roleRepo,
		PermissionRepo: permissionRepo,
		MenuRepo:       menuRepo,
	}
}

func (s *RoleService) Create(req dto.RoleCreate) (domainrole.Role, error) {
	// Check if role with same name already exists
	existing, _ := s.RoleRepo.GetByName(req.Name)
	if existing.Id != "" {
		return domainrole.Role{}, errors.New("role with this name already exists")
	}

	data := domainrole.Role{
		Id:          utils.CreateUUID(),
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		IsSystem:    false,
		CreatedAt:   time.Now(),
	}

	if err := s.RoleRepo.Store(data); err != nil {
		return domainrole.Role{}, err
	}

	return data, nil
}

func (s *RoleService) GetByID(id string) (domainrole.Role, error) {
	return s.RoleRepo.GetByID(id)
}

func (s *RoleService) GetByIDWithDetails(id string) (dto.RoleWithDetails, error) {
	role, err := s.RoleRepo.GetByID(id)
	if err != nil {
		return dto.RoleWithDetails{}, err
	}

	// Get permissions
	permissionIds, err := s.RoleRepo.GetRolePermissions(id)
	if err != nil {
		return dto.RoleWithDetails{}, err
	}

	menuIds, err := s.deriveMenuIDsFromPermissions(permissionIds)
	if err != nil {
		return dto.RoleWithDetails{}, err
	}

	updatedAt := ""
	if role.UpdatedAt != nil {
		updatedAt = role.UpdatedAt.Format(time.RFC3339)
	}

	return dto.RoleWithDetails{
		Id:            role.Id,
		Name:          role.Name,
		DisplayName:   role.DisplayName,
		Description:   role.Description,
		IsSystem:      role.IsSystem,
		PermissionIds: permissionIds,
		MenuIds:       menuIds,
		CreatedAt:     role.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     updatedAt,
	}, nil
}

func (s *RoleService) GetAll(params filter.BaseParams, currentUserRole string) ([]domainrole.Role, int64, error) {
	roles, total, err := s.RoleRepo.GetAll(params)
	if err != nil {
		return nil, 0, err
	}

	// Filter out superadmin role unless the current user is also a superadmin
	if currentUserRole != utils.RoleSuperAdmin {
		filteredRoles := make([]domainrole.Role, 0)
		for _, role := range roles {
			if role.Name != utils.RoleSuperAdmin {
				filteredRoles = append(filteredRoles, role)
			}
		}
		superadminCount := int64(len(roles) - len(filteredRoles))
		return filteredRoles, total - superadminCount, nil
	}

	return roles, total, nil
}

func (s *RoleService) Update(id string, req dto.RoleUpdate) (domainrole.Role, error) {
	role, err := s.RoleRepo.GetByID(id)
	if err != nil {
		return domainrole.Role{}, err
	}

	// Prevent updating system roles
	if role.IsSystem {
		return domainrole.Role{}, errors.New("cannot update system roles")
	}

	// Update only provided fields
	if req.DisplayName != "" {
		role.DisplayName = req.DisplayName
	}
	role.Description = req.Description
	now := time.Now()
	role.UpdatedAt = &now

	if err := s.RoleRepo.Update(role); err != nil {
		return domainrole.Role{}, err
	}

	return role, nil
}

func (s *RoleService) Delete(id string) error {
	role, err := s.RoleRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Prevent deleting system roles
	if role.IsSystem {
		return errors.New("cannot delete system roles")
	}

	return s.RoleRepo.Delete(id)
}

func (s *RoleService) AssignPermissions(roleId string, req dto.AssignPermissions, currentUserRole string) error {
	// Verify role exists
	role, err := s.RoleRepo.GetByID(roleId)
	if err != nil {
		return err
	}

	// Check permissions for modifying system roles
	if role.IsSystem {
		// Only superadmin can modify the superadmin role itself.
		if role.Name == utils.RoleSuperAdmin && currentUserRole != utils.RoleSuperAdmin {
			return errors.New("access denied: cannot modify superadmin role")
		}
	}

	// Verify all permissions exist
	for _, permId := range req.PermissionIds {
		if _, err := s.PermissionRepo.GetByID(permId); err != nil {
			return errors.New("invalid permission ID: " + permId)
		}
	}

	return s.RoleRepo.AssignPermissions(roleId, req.PermissionIds)
}

func (s *RoleService) GetRolePermissions(roleId string) ([]string, error) {
	return s.RoleRepo.GetRolePermissions(roleId)
}

func (s *RoleService) GetRoleMenus(roleId string) ([]string, error) {
	permissionIds, err := s.RoleRepo.GetRolePermissions(roleId)
	if err != nil {
		return nil, err
	}

	return s.deriveMenuIDsFromPermissions(permissionIds)
}

var _ interfacerole.ServiceRoleInterface = (*RoleService)(nil)

func (s *RoleService) deriveMenuIDsFromPermissions(permissionIDs []string) ([]string, error) {
	menus, err := s.MenuRepo.GetActiveMenus()
	if err != nil {
		return nil, err
	}

	permissions := make([]domainpermission.Permission, 0, len(permissionIDs))
	for _, permissionID := range permissionIDs {
		permission, err := s.PermissionRepo.GetByID(permissionID)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, permission)
	}

	allowedResources := make(map[string]struct{}, len(permissions))
	for _, permission := range permissions {
		allowedResources[permission.Resource] = struct{}{}
	}

	menuMap := make(map[string]domainmenu.MenuItem, len(menus))
	for _, menu := range menus {
		menuMap[menu.Id] = menu
	}

	allowedMenuIDs := make(map[string]struct{})
	for _, menu := range menus {
		if roleCanAccessMenu(menu, allowedResources) {
			allowedMenuIDs[menu.Id] = struct{}{}
			includeRoleParentMenus(menu, menuMap, allowedMenuIDs)
		}
	}

	menuIDs := make([]string, 0, len(allowedMenuIDs))
	for _, menu := range menus {
		if _, ok := allowedMenuIDs[menu.Id]; ok {
			menuIDs = append(menuIDs, menu.Id)
		}
	}

	return menuIDs, nil
}

func roleCanAccessMenu(menu domainmenu.MenuItem, allowedResources map[string]struct{}) bool {
	for _, resource := range roleMenuResources(menu) {
		if _, ok := allowedResources[resource]; ok {
			return true
		}
	}

	return false
}

func includeRoleParentMenus(
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

func roleMenuResources(menu domainmenu.MenuItem) []string {
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
