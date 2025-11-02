package servicemenu

import (
	"errors"
	"safety-riding/internal/domain/menu"
	"safety-riding/internal/dto"
	"safety-riding/internal/interfaces/menu"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"time"
)

type MenuService struct {
	MenuRepo interfacemenu.RepoMenuInterface
}

func NewMenuService(menuRepo interfacemenu.RepoMenuInterface) *MenuService {
	return &MenuService{
		MenuRepo: menuRepo,
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

func (s *MenuService) GetUserMenus(userId string) ([]domainmenu.MenuItem, error) {
	return s.MenuRepo.GetUserMenus(userId)
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
