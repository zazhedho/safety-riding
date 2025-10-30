package repository

import (
	"workshop-management/internal/domain/auth"

	"gorm.io/gorm"
)

type blacklistRepo struct {
	DB *gorm.DB
}

func NewBlacklistRepo(db *gorm.DB) auth.RepoAuth {
	return &blacklistRepo{
		DB: db,
	}
}

func (r *blacklistRepo) Store(blacklist auth.Blacklist) error {
	return r.DB.Create(&blacklist).Error
}

func (r *blacklistRepo) GetByToken(token string) (auth.Blacklist, error) {
	var blacklist auth.Blacklist
	err := r.DB.Where("token = ?", token).First(&blacklist).Error
	return blacklist, err
}
