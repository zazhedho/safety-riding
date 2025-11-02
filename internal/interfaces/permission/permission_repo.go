package interfacepermission

import (
	"safety-riding/internal/domain/permission"
	"safety-riding/pkg/filter"
)

type RepoPermissionInterface interface {
	Store(m domainpermission.Permission) error
	GetByID(id string) (domainpermission.Permission, error)
	GetByName(name string) (domainpermission.Permission, error)
	GetAll(params filter.BaseParams) ([]domainpermission.Permission, int64, error)
	Update(m domainpermission.Permission) error
	Delete(id string) error

	// Get permissions by resource
	GetByResource(resource string) ([]domainpermission.Permission, error)

	// Get user permissions (through role)
	GetUserPermissions(userId string) ([]domainpermission.Permission, error)
}
