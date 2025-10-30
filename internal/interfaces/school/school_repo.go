package interfaceschool

import domainschool "safety-riding/internal/domain/school"

type RepoSchoolInterface interface {
	Create(school domainschool.School) error
}
