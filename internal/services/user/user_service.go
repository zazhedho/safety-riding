package user

import (
	"errors"
	"safety-riding/internal/domain/auth"
	"safety-riding/internal/domain/user"
	"safety-riding/internal/dto"
	"safety-riding/internal/interfaces/auth"
	"safety-riding/internal/interfaces/permission"
	"safety-riding/internal/interfaces/role"
	"safety-riding/internal/interfaces/user"
	"safety-riding/pkg/filter"
	"safety-riding/utils"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type ServiceUser struct {
	UserRepo       interfaceuser.RepoUserInterface
	BlacklistRepo  interfaceauth.RepoAuthInterface
	RoleRepo       interfacerole.RepoRoleInterface
	PermissionRepo interfacepermission.RepoPermissionInterface
}

func NewUserService(userRepo interfaceuser.RepoUserInterface, blacklistRepo interfaceauth.RepoAuthInterface, roleRepo interfacerole.RepoRoleInterface, permissionRepo interfacepermission.RepoPermissionInterface) *ServiceUser {
	return &ServiceUser{
		UserRepo:       userRepo,
		BlacklistRepo:  blacklistRepo,
		RoleRepo:       roleRepo,
		PermissionRepo: permissionRepo,
	}
}

func (s *ServiceUser) RegisterUser(req dto.UserRegister) (domainuser.Users, error) {
	data, _ := s.UserRepo.GetByEmail(req.Email)
	if data.Id != "" || data.Email == req.Email || data.Phone == req.Phone {
		return domainuser.Users{}, errors.New("email or phone already exists")
	}
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return domainuser.Users{}, err
	}

	phone := utils.NormalizePhoneTo62(req.Phone)
	data = domainuser.Users{
		Id:        utils.CreateUUID(),
		Name:      req.Name,
		Phone:     phone,
		Email:     req.Email,
		Password:  string(hashedPwd),
		Role:      utils.RoleViewer,
		CreatedAt: time.Now(),
	}

	if err = s.UserRepo.Store(data); err != nil {
		return domainuser.Users{}, err
	}

	return data, nil
}

func (s *ServiceUser) LoginUser(req dto.Login, logId string) (string, error) {
	data, err := s.UserRepo.GetByEmail(req.Email)
	if err != nil {
		return "", err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(data.Password), []byte(req.Password)); err != nil {
		return "", err
	}

	token, err := utils.GenerateJwt(&data, logId)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *ServiceUser) LogoutUser(token string) error {
	blacklist := domainauth.Blacklist{
		ID:        utils.CreateUUID(),
		Token:     token,
		CreatedAt: time.Now(),
	}

	err := s.BlacklistRepo.Store(blacklist)
	if err != nil {
		return err
	}

	return nil
}

func (s *ServiceUser) GetUserById(id string) (domainuser.Users, error) {
	return s.UserRepo.GetByID(id)
}

func (s *ServiceUser) GetUserByAuth(id string) (map[string]interface{}, error) {
	user, err := s.UserRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Get role by name
	role, err := s.RoleRepo.GetByName(user.Role)
	if err != nil {
		return map[string]interface{}{
			"id":          user.Id,
			"name":        user.Name,
			"email":       user.Email,
			"phone":       user.Phone,
			"role":        user.Role,
			"permissions": []string{},
			"created_at":  user.CreatedAt,
			"updated_at":  user.UpdatedAt,
		}, nil
	}

	// Get permission IDs for this role
	permissionIds, err := s.RoleRepo.GetRolePermissions(role.Id)
	if err != nil {
		return map[string]interface{}{
			"id":          user.Id,
			"name":        user.Name,
			"email":       user.Email,
			"phone":       user.Phone,
			"role":        user.Role,
			"permissions": []string{},
			"created_at":  user.CreatedAt,
			"updated_at":  user.UpdatedAt,
		}, nil
	}

	// Get permission names from IDs
	permissionNames := []string{}
	for _, permId := range permissionIds {
		perm, err := s.PermissionRepo.GetByID(permId)
		if err == nil {
			permissionNames = append(permissionNames, perm.Name)
		}
	}

	return map[string]interface{}{
		"id":          user.Id,
		"name":        user.Name,
		"email":       user.Email,
		"phone":       user.Phone,
		"role":        user.Role,
		"permissions": permissionNames,
		"created_at":  user.CreatedAt,
		"updated_at":  user.UpdatedAt,
	}, nil
}

func (s *ServiceUser) GetAllUsers(params filter.BaseParams) ([]domainuser.Users, int64, error) {
	return s.UserRepo.GetAll(params)
}

func (s *ServiceUser) Update(id, role string, req dto.UserUpdate) (domainuser.Users, error) {
	data, err := s.UserRepo.GetByID(id)
	if err != nil {
		return domainuser.Users{}, err
	}

	if req.Name != "" {
		data.Name = req.Name
	}

	if req.Phone != "" {
		phone := utils.NormalizePhoneTo62(req.Phone)
		data.Phone = phone
	}

	if req.Email != "" {
		data.Email = req.Email
	}

	if role == utils.RoleAdmin {
		if req.Role != "" {
			data.Role = strings.ToLower(req.Role)
		}
	}

	if err = s.UserRepo.Update(data); err != nil {
		return domainuser.Users{}, err
	}

	return data, nil
}

func (s *ServiceUser) ChangePassword(id string, req dto.ChangePassword) (domainuser.Users, error) {
	if req.CurrentPassword == req.NewPassword {
		return domainuser.Users{}, errors.New("new password must be different from current password")
	}

	data, err := s.UserRepo.GetByID(id)
	if err != nil {
		return domainuser.Users{}, err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(data.Password), []byte(req.CurrentPassword)); err != nil {
		return domainuser.Users{}, err
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return domainuser.Users{}, err
	}

	data.Password = string(hashedPwd)

	if err = s.UserRepo.Update(data); err != nil {
		return domainuser.Users{}, err
	}

	return data, nil
}

func (s *ServiceUser) Delete(id string) error {
	return s.UserRepo.Delete(id)
}
