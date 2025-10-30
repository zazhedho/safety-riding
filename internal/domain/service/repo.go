package service

import (
	"workshop-management/pkg/filter"
)

type RepoService interface {
	Store(m Service) error
	Fetch(params filter.BaseParams) ([]Service, int64, error)
	GetById(id string) (Service, error)
	Update(m Service, data interface{}) (int64, error)
	Delete(m Service, data interface{}) error
}
