package interfacerole

import (
	domainrole "safety-riding/internal/domain/role"
	"safety-riding/internal/dto"
	"safety-riding/pkg/filter"
)

type ServiceRoleInterface interface {
	Create(req dto.RoleCreate) (domainrole.Role, error)
	GetByID(id string) (domainrole.Role, error)
	GetByIDWithDetails(id string) (dto.RoleWithDetails, error)
	GetAll(params filter.BaseParams, currentUserRole string) ([]domainrole.Role, int64, error)
	Update(id string, req dto.RoleUpdate) (domainrole.Role, error)
	Delete(id string) error
	AssignPermissions(roleId string, req dto.AssignPermissions) error
	AssignMenus(roleId string, req dto.AssignMenus) error
	GetRolePermissions(roleId string) ([]string, error)
	GetRoleMenus(roleId string) ([]string, error)
}
