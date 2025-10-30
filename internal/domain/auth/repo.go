package auth

type RepoAuth interface {
	Store(m Blacklist) error
	GetByToken(token string) (Blacklist, error)
}
