package interfaceauth

import "safety-riding/internal/domain/auth"

type RepoAuthInterface interface {
	Store(m domainauth.Blacklist) error
	GetByToken(token string) (domainauth.Blacklist, error)
}
