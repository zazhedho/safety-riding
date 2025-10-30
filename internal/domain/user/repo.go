package user

import (
	"workshop-management/pkg/filter"
)

type RepoUser interface {
	Store(m Users) error
	GetByEmail(email string) (Users, error)
	GetByID(id string) (Users, error)
	GetAll(params filter.BaseParams) ([]Users, int64, error)
	Update(m Users) error
	Delete(id string) error
}
