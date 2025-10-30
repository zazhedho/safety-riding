package user

import (
	"errors"
	"time"
	"workshop-management/internal/domain/auth"
	"workshop-management/internal/domain/user"
	"workshop-management/internal/dto"
	"workshop-management/pkg/filter"
	"workshop-management/utils"

	"golang.org/x/crypto/bcrypt"
)

type ServiceUser struct {
	UserRepo      user.RepoUser
	BlacklistRepo auth.RepoAuth
}

func NewUserService(userRepo user.RepoUser, blacklistRepo auth.RepoAuth) *ServiceUser {
	return &ServiceUser{
		UserRepo:      userRepo,
		BlacklistRepo: blacklistRepo,
	}
}

func (s *ServiceUser) RegisterUser(req dto.UserRegister) (user.Users, error) {
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return user.Users{}, err
	}

	data := user.Users{
		Id:        utils.CreateUUID(),
		Name:      req.Name,
		Phone:     req.Phone,
		Email:     req.Email,
		Password:  string(hashedPwd),
		Role:      utils.RoleCustomer,
		CreatedAt: time.Now(),
	}

	if err = s.UserRepo.Store(data); err != nil {
		return user.Users{}, err
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
	blacklist := auth.Blacklist{
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

func (s *ServiceUser) GetUserById(id string) (user.Users, error) {
	return s.UserRepo.GetByID(id)
}

func (s *ServiceUser) GetUserByAuth(id string) (user.Users, error) {
	return s.UserRepo.GetByID(id)
}

func (s *ServiceUser) GetAllUsers(params filter.BaseParams) ([]user.Users, int64, error) {
	return s.UserRepo.GetAll(params)
}

func (s *ServiceUser) Update(id string, req dto.UserUpdate) (user.Users, error) {
	data, err := s.UserRepo.GetByID(id)
	if err != nil {
		return user.Users{}, err
	}

	if req.Name != "" {
		data.Name = req.Name
	}

	if req.Phone != "" {
		data.Phone = req.Phone
	}

	if req.Email != "" {
		data.Email = req.Email
	}

	if err = s.UserRepo.Update(data); err != nil {
		return user.Users{}, err
	}

	return data, nil
}

func (s *ServiceUser) ChangePassword(id string, req dto.ChangePassword) (user.Users, error) {
	if req.CurrentPassword == req.NewPassword {
		return user.Users{}, errors.New("new password must be different from current password")
	}

	data, err := s.UserRepo.GetByID(id)
	if err != nil {
		return user.Users{}, err
	}

	if err = bcrypt.CompareHashAndPassword([]byte(data.Password), []byte(req.CurrentPassword)); err != nil {
		return user.Users{}, err
	}

	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return user.Users{}, err
	}

	data.Password = string(hashedPwd)

	if err = s.UserRepo.Update(data); err != nil {
		return user.Users{}, err
	}

	return data, nil
}

func (s *ServiceUser) Delete(id string) error {
	return s.UserRepo.Delete(id)
}
