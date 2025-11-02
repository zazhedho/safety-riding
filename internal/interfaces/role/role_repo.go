package interfacerole

import (
	"safety-riding/internal/domain/role"
	"safety-riding/pkg/filter"
)

type RepoRoleInterface interface {
	Store(m domainrole.Role) error
	GetByID(id string) (domainrole.Role, error)
	GetByName(name string) (domainrole.Role, error)
	GetAll(params filter.BaseParams) ([]domainrole.Role, int64, error)
	Update(m domainrole.Role) error
	Delete(id string) error

	// Permission management
	AssignPermissions(roleId string, permissionIds []string) error
	RemovePermissions(roleId string, permissionIds []string) error
	GetRolePermissions(roleId string) ([]string, error)

	// Menu management
	AssignMenus(roleId string, menuIds []string) error
	RemoveMenus(roleId string, menuIds []string) error
	GetRoleMenus(roleId string) ([]string, error)
}
