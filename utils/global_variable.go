package utils

const (
	CtxKeyId       = "CTX_ID"
	CtxKeyAuthData = "auth_data"
)

// Redis Key
const (
	RedisAppConf = "cache:config:app"
	RedisDbConf  = "cache:config:db"
)

const (
	RoleAdmin    = "admin"
	RoleMember   = "member"
	RoleCustomer = "customer"
	RoleMechanic = "mechanic"
	RoleCashier  = "cashier"
)

const (
	StsPending    = "pending"
	StsConfirmed  = "confirmed"
	StsCancelled  = "cancelled"
	StsCompleted  = "completed"
	StsOnProgress = "on progress"
	StsApproved   = "approved"
	StsRejected   = "rejected"
	StsOpen       = "open"
)
