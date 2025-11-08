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
	RoleSuperAdmin = "superadmin" // Highest privilege, hidden from admins
	RoleAdmin      = "admin"
	RoleStaff      = "staff"
	RoleMember     = "member"
	RoleViewer     = "viewer"
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
	StsPlanned    = "planned"
	StsOnGoing    = "ongoing"
)
