package serviceuser

import (
	"errors"
	"regexp"
	domainauth "safety-riding/internal/domain/auth"
	domainuser "safety-riding/internal/domain/user"
	"safety-riding/internal/dto"
	interfaceauth "safety-riding/internal/interfaces/auth"
	interfacepermission "safety-riding/internal/interfaces/permission"
	interfacerole "safety-riding/internal/interfaces/role"
	interfaceuser "safety-riding/internal/interfaces/user"
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

// ValidatePasswordStrength validates password strength requirements
// Password must contain:
// - At least 8 characters
// - At least 1 lowercase letter (a-z)
// - At least 1 uppercase letter (A-Z)
// - At least 1 number (0-9)
// - At least 1 special character/symbol
func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	if !hasLower {
		return errors.New("password must contain at least 1 lowercase letter (a-z)")
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	if !hasUpper {
		return errors.New("password must contain at least 1 uppercase letter (A-Z)")
	}

	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	if !hasNumber {
		return errors.New("password must contain at least 1 number (0-9)")
	}

	hasSymbol := regexp.MustCompile(`[^a-zA-Z0-9]`).MatchString(password)
	if !hasSymbol {
		return errors.New("password must contain at least 1 symbol (!@#$%^&*...)")
	}

	return nil
}

func (s *ServiceUser) RegisterUser(req dto.UserRegister) (domainuser.Users, error) {
	phone := utils.NormalizePhoneTo62(req.Phone)

	data, _ := s.UserRepo.GetByEmail(req.Email)
	if data.Id != "" {
		return domainuser.Users{}, errors.New("email already exists")
	}

	phoneData, _ := s.UserRepo.GetByPhone(phone)
	if phoneData.Id != "" {
		return domainuser.Users{}, errors.New("phone number already exists")
	}

	// Validate password strength
	if err := ValidatePasswordStrength(req.Password); err != nil {
		return domainuser.Users{}, err
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return domainuser.Users{}, err
	}
	var roleName = utils.RoleViewer
	if strings.TrimSpace(req.Role) != "" {
		roleName = strings.ToLower(req.Role)
	}

	var roleId *string
	roleEntity, err := s.RoleRepo.GetByName(roleName)
	if err == nil && roleEntity.Id != "" {
		roleId = &roleEntity.Id
	} else {
		// Fallback to viewer role if the provided role does not exist
		roleName = utils.RoleViewer
		if viewerRole, errViewer := s.RoleRepo.GetByName(utils.RoleViewer); errViewer == nil && viewerRole.Id != "" {
			roleId = &viewerRole.Id
		}
	}

	data = domainuser.Users{
		Id:        utils.CreateUUID(),
		Name:      req.Name,
		Phone:     phone,
		Email:     req.Email,
		Password:  string(hashedPwd),
		Role:      roleName,
		RoleId:    roleId,
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

func (s *ServiceUser) GetUserByEmail(email string) (domainuser.Users, error) {
	return s.UserRepo.GetByEmail(email)
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

func (s *ServiceUser) GetAllUsers(params filter.BaseParams, currentUserRole string) ([]domainuser.Users, int64, error) {
	users, total, err := s.UserRepo.GetAll(params)
	if err != nil {
		return nil, 0, err
	}

	// Filter out superadmin users unless the current user is also a superadmin
	if currentUserRole != utils.RoleSuperAdmin {
		filteredUsers := make([]domainuser.Users, 0)
		for _, user := range users {
			if user.Role != utils.RoleSuperAdmin {
				filteredUsers = append(filteredUsers, user)
			}
		}
		// Adjust total count to exclude superadmin users
		superadminCount := int64(len(users) - len(filteredUsers))
		return filteredUsers, total - superadminCount, nil
	}

	return users, total, nil
}

func (s *ServiceUser) Update(id, role string, req dto.UserUpdate) (domainuser.Users, error) {
	data, err := s.UserRepo.GetByID(id)
	if err != nil {
		return domainuser.Users{}, err
	}

	// Prevent non-superadmin from modifying superadmin users
	if data.Role == utils.RoleSuperAdmin && role != utils.RoleSuperAdmin {
		return domainuser.Users{}, errors.New("cannot modify superadmin users")
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

	if role == utils.RoleAdmin && strings.TrimSpace(req.Role) != "" {
		newRoleName := strings.ToLower(req.Role)

		// Prevent admin from assigning superadmin role
		if newRoleName == utils.RoleSuperAdmin {
			return domainuser.Users{}, errors.New("cannot assign superadmin role")
		}

		data.Role = newRoleName

		roleEntity, err := s.RoleRepo.GetByName(newRoleName)
		if err == nil && roleEntity.Id != "" {
			data.RoleId = &roleEntity.Id
		} else {
			data.RoleId = nil
		}
	}

	// Allow superadmin to change any role including to/from superadmin
	if role == utils.RoleSuperAdmin && strings.TrimSpace(req.Role) != "" {
		newRoleName := strings.ToLower(req.Role)
		data.Role = newRoleName

		roleEntity, err := s.RoleRepo.GetByName(newRoleName)
		if err == nil && roleEntity.Id != "" {
			data.RoleId = &roleEntity.Id
		} else {
			data.RoleId = nil
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

	// Validate new password strength
	if err := ValidatePasswordStrength(req.NewPassword); err != nil {
		return domainuser.Users{}, err
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

var _ interfaceuser.ServiceUserInterface = (*ServiceUser)(nil)
