package servicerole

import (
	"errors"
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

	// Get menus
	menuIds, err := s.RoleRepo.GetRoleMenus(id)
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

func (s *RoleService) AssignPermissions(roleId string, req dto.AssignPermissions) error {
	// Verify role exists
	_, err := s.RoleRepo.GetByID(roleId)
	if err != nil {
		return err
	}

	// Verify all permissions exist
	for _, permId := range req.PermissionIds {
		if _, err := s.PermissionRepo.GetByID(permId); err != nil {
			return errors.New("invalid permission ID: " + permId)
		}
	}

	return s.RoleRepo.AssignPermissions(roleId, req.PermissionIds)
}

func (s *RoleService) AssignMenus(roleId string, req dto.AssignMenus) error {
	// Verify role exists
	_, err := s.RoleRepo.GetByID(roleId)
	if err != nil {
		return err
	}

	// Verify all menus exist
	for _, menuId := range req.MenuIds {
		if _, err := s.MenuRepo.GetByID(menuId); err != nil {
			return errors.New("invalid menu ID: " + menuId)
		}
	}

	return s.RoleRepo.AssignMenus(roleId, req.MenuIds)
}

func (s *RoleService) GetRolePermissions(roleId string) ([]string, error) {
	return s.RoleRepo.GetRolePermissions(roleId)
}

func (s *RoleService) GetRoleMenus(roleId string) ([]string, error) {
	return s.RoleRepo.GetRoleMenus(roleId)
}
