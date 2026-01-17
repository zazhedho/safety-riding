package repositoryauth

import (
	"safety-riding/internal/domain/auth"
	"safety-riding/internal/interfaces/auth"

	"gorm.io/gorm"
)

type blacklistRepo struct {
	DB *gorm.DB
}

func NewBlacklistRepo(db *gorm.DB) interfaceauth.RepoAuthInterface {
	return &blacklistRepo{
		DB: db,
	}
}

func (r *blacklistRepo) Store(blacklist domainauth.Blacklist) error {
	return r.DB.Create(&blacklist).Error
}

func (r *blacklistRepo) GetByToken(token string) (domainauth.Blacklist, error) {
	var blacklist domainauth.Blacklist
	err := r.DB.Session(&gorm.Session{Logger: r.DB.Logger.LogMode(0)}).Where("token = ?", token).First(&blacklist).Error
	return blacklist, err
}
