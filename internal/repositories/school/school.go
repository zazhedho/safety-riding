package repositoryschool

import (
	domainschool "safety-riding/internal/domain/school"
	interfaceschool "safety-riding/internal/interfaces/school"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewSchoolRepo(db *gorm.DB) interfaceschool.RepoSchoolInterface {
	return &repo{
		DB: db,
	}
}

func (r *repo) Create(school domainschool.School) error {
	return r.DB.Create(&school).Error
}
