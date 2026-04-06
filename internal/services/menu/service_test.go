package servicemenu

import (
	"testing"

	domainmenu "safety-riding/internal/domain/menu"
	domainpermission "safety-riding/internal/domain/permission"

	"safety-riding/pkg/filter"
)

type stubMenuRepo struct {
	menus []domainmenu.MenuItem
}

func (s *stubMenuRepo) Store(m domainmenu.MenuItem) error { return nil }
func (s *stubMenuRepo) GetByID(id string) (domainmenu.MenuItem, error) {
	return domainmenu.MenuItem{}, nil
}
func (s *stubMenuRepo) GetByName(name string) (domainmenu.MenuItem, error) {
	return domainmenu.MenuItem{}, nil
}
func (s *stubMenuRepo) GetAll(params filter.BaseParams) ([]domainmenu.MenuItem, int64, error) {
	return s.menus, int64(len(s.menus)), nil
}
func (s *stubMenuRepo) Update(m domainmenu.MenuItem) error { return nil }
func (s *stubMenuRepo) Delete(id string) error             { return nil }
func (s *stubMenuRepo) GetActiveMenus() ([]domainmenu.MenuItem, error) {
	return s.menus, nil
}
func (s *stubMenuRepo) GetUserMenus(userId string) ([]domainmenu.MenuItem, error) {
	return s.menus, nil
}

type stubPermissionRepo struct {
	permissions []domainpermission.Permission
}

func (s *stubPermissionRepo) Store(m domainpermission.Permission) error { return nil }
func (s *stubPermissionRepo) GetByID(id string) (domainpermission.Permission, error) {
	return domainpermission.Permission{}, nil
}
func (s *stubPermissionRepo) GetByName(name string) (domainpermission.Permission, error) {
	return domainpermission.Permission{}, nil
}
func (s *stubPermissionRepo) GetAll(params filter.BaseParams) ([]domainpermission.Permission, int64, error) {
	return s.permissions, int64(len(s.permissions)), nil
}
func (s *stubPermissionRepo) Update(m domainpermission.Permission) error { return nil }
func (s *stubPermissionRepo) Delete(id string) error                     { return nil }
func (s *stubPermissionRepo) GetByResource(resource string) ([]domainpermission.Permission, error) {
	return nil, nil
}
func (s *stubPermissionRepo) GetUserPermissions(userId string) ([]domainpermission.Permission, error) {
	return s.permissions, nil
}

func TestGetUserMenus_IncludesParentMenuEvenWhenParentOrderedAfterChild(t *testing.T) {
	parentID := "education-parent"
	svc := NewMenuService(
		&stubMenuRepo{
			menus: []domainmenu.MenuItem{
				{Id: "education-stats", Name: "education_stats", DisplayName: "Education Stats", ParentId: &parentID, OrderIndex: 1, IsActive: true},
				{Id: "education-priority", Name: "education_priority", DisplayName: "Education Priority", ParentId: &parentID, OrderIndex: 2, IsActive: true},
				{Id: parentID, Name: "education", DisplayName: "Education", OrderIndex: 7, IsActive: true},
			},
		},
		&stubPermissionRepo{
			permissions: []domainpermission.Permission{
				{Resource: "education_stats", Action: "view"},
			},
		},
	)

	menus, err := svc.GetUserMenus("user-id", "admin")
	if err != nil {
		t.Fatalf("GetUserMenus returned error: %v", err)
	}

	foundParent := false
	foundChild := false
	for _, menu := range menus {
		if menu.Name == "education" {
			foundParent = true
		}
		if menu.Name == "education_stats" {
			foundChild = true
		}
	}

	if !foundChild {
		t.Fatalf("expected child menu education_stats to be included")
	}

	if !foundParent {
		t.Fatalf("expected parent menu education to be included")
	}
}
