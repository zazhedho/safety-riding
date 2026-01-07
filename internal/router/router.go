package router

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"

	"safety-riding/infrastructure/database"
	"safety-riding/infrastructure/media"
	accidentHandler "safety-riding/internal/handlers/http/accident"
	budgetHandler "safety-riding/internal/handlers/http/budget"
	cityHandler "safety-riding/internal/handlers/http/city"
	dashboardHandler "safety-riding/internal/handlers/http/dashboard"
	districtHandler "safety-riding/internal/handlers/http/district"
	eventHandler "safety-riding/internal/handlers/http/event"
	marketshareHandler "safety-riding/internal/handlers/http/marketshare"
	menuHandler "safety-riding/internal/handlers/http/menu"
	permissionHandler "safety-riding/internal/handlers/http/permission"
	poldaHandler "safety-riding/internal/handlers/http/polda"
	provinceHandler "safety-riding/internal/handlers/http/province"
	publicsHandler "safety-riding/internal/handlers/http/publics"
	roleHandler "safety-riding/internal/handlers/http/role"
	schoolHandler "safety-riding/internal/handlers/http/school"
	sessionHandler "safety-riding/internal/handlers/http/session"
	userHandler "safety-riding/internal/handlers/http/user"
	accidentRepo "safety-riding/internal/repositories/accident"
	authRepo "safety-riding/internal/repositories/auth"
	budgetRepo "safety-riding/internal/repositories/budget"
	repodashboard "safety-riding/internal/repositories/dashboard"
	eventRepo "safety-riding/internal/repositories/event"
	marketshareRepo "safety-riding/internal/repositories/marketshare"
	menuRepo "safety-riding/internal/repositories/menu"
	permissionRepo "safety-riding/internal/repositories/permission"
	poldaRepo "safety-riding/internal/repositories/polda"
	publicsRepo "safety-riding/internal/repositories/publics"
	roleRepo "safety-riding/internal/repositories/role"
	schoolRepo "safety-riding/internal/repositories/school"
	sessionRepo "safety-riding/internal/repositories/session"
	userRepo "safety-riding/internal/repositories/user"
	accidentSvc "safety-riding/internal/services/accident"
	budgetSvc "safety-riding/internal/services/budget"
	kabupatenSvc "safety-riding/internal/services/city"
	dashboardSvc "safety-riding/internal/services/dashboard"
	kecamatanSvc "safety-riding/internal/services/district"
	eventSvc "safety-riding/internal/services/event"
	marketshareSvc "safety-riding/internal/services/marketshare"
	menuSvc "safety-riding/internal/services/menu"
	permissionSvc "safety-riding/internal/services/permission"
	poldaSvc "safety-riding/internal/services/polda"
	provinsiSvc "safety-riding/internal/services/province"
	publicsSvc "safety-riding/internal/services/publics"
	roleSvc "safety-riding/internal/services/role"
	schoolSvc "safety-riding/internal/services/school"
	sessionSvc "safety-riding/internal/services/session"
	userSvc "safety-riding/internal/services/user"
	"safety-riding/middlewares"
	"safety-riding/pkg/logger"
	"safety-riding/pkg/security"
	"safety-riding/utils"
)

type Routes struct {
	App *gin.Engine
	DB  *gorm.DB
}

func NewRoutes() *Routes {
	app := gin.Default()

	app.Use(middlewares.CORS())
	app.Use(gin.CustomRecovery(middlewares.ErrorHandler))
	app.Use(middlewares.SetContextId())

	// health check
	app.GET("/healthcheck", func(ctx *gin.Context) {
		logger.WriteLog(logger.LogLevelDebug, "ClientIP: "+ctx.ClientIP())
		ctx.JSON(http.StatusOK, gin.H{
			"message": "OK!!",
		})
	})
	app.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return &Routes{
		App: app,
	}
}

func (r *Routes) UserRoutes() {
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	repo := userRepo.NewUserRepo(r.DB)
	rRepo := roleRepo.NewRoleRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	uc := userSvc.NewUserService(repo, blacklistRepo, rRepo, pRepo)
	redisClient := database.GetRedisClient()
	loginLimiter := security.NewRedisLoginLimiter(
		redisClient,
		utils.GetEnv("LOGIN_ATTEMPT_LIMIT", 5).(int),
		time.Duration(utils.GetEnv("LOGIN_ATTEMPT_WINDOW_SECONDS", 60).(int))*time.Second,
		time.Duration(utils.GetEnv("LOGIN_BLOCK_DURATION_SECONDS", 300).(int))*time.Second,
	)
	h := userHandler.NewUserHandler(uc, loginLimiter)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	registerLimit := utils.GetEnv("REGISTER_RATE_LIMIT", 5).(int)
	registerWindowSeconds := utils.GetEnv("REGISTER_RATE_WINDOW_SECONDS", 60).(int)
	if registerWindowSeconds <= 0 {
		registerWindowSeconds = 60
	}
	registerLimiter := middlewares.IPRateLimitMiddleware(
		redisClient,
		"user_register",
		registerLimit,
		time.Duration(registerWindowSeconds)*time.Second,
	)

	user := r.App.Group("/api/user")
	{
		user.POST("/register", registerLimiter, h.Register)
		user.POST("/login", h.Login)
		user.POST("/forgot-password", h.ForgotPassword)
		user.POST("/reset-password", h.ResetPassword)

		userPriv := user.Group("").Use(mdw.AuthMiddleware())
		{
			userPriv.POST("/logout", h.Logout)
			userPriv.GET("", h.GetUserByAuth)
			userPriv.GET("/:id", mdw.PermissionMiddleware("users", "view"), h.GetUserById)
			userPriv.PUT("", h.Update)
			userPriv.PUT("/:id", mdw.PermissionMiddleware("users", "update"), h.UpdateUserById)
			userPriv.PUT("/change/password", h.ChangePassword)
			userPriv.DELETE("", h.Delete)
			userPriv.DELETE("/:id", mdw.PermissionMiddleware("users", "delete"), h.DeleteUserById)
		}
	}

	r.App.GET("/api/users", mdw.AuthMiddleware(), mdw.PermissionMiddleware("users", "view"), h.GetAllUsers)
}

func (r *Routes) SchoolRoutes() {
	repo := schoolRepo.NewSchoolRepo(r.DB)
	svc := schoolSvc.NewSchoolService(repo)
	h := schoolHandler.NewSchoolHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	r.App.GET("/api/schools", mdw.AuthMiddleware(), h.FetchSchool)

	// Education endpoints (cross-domain analytics)
	r.App.GET("/api/education/stats", mdw.AuthMiddleware(), h.GetEducationStats)
	r.App.GET("/api/education/priority", mdw.AuthMiddleware(), h.GetEducationPriority)

	school := r.App.Group("/api/school").Use(mdw.AuthMiddleware())
	{
		school.POST("", mdw.PermissionMiddleware("schools", "create"), h.AddSchool)
		school.GET("/:id", h.GetSchoolById)
		school.PUT("/:id", mdw.PermissionMiddleware("schools", "update"), h.UpdateSchool)
		school.DELETE("/:id", mdw.PermissionMiddleware("schools", "delete"), h.DeleteSchool)
	}
}

func (r *Routes) PublicRoutes() {
	repo := publicsRepo.NewPublicRepo(r.DB)
	svc := publicsSvc.NewPublicService(repo)
	h := publicsHandler.NewPublicHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	r.App.GET("/api/publics", mdw.AuthMiddleware(), h.FetchPublic)
	r.App.GET("/api/publics/education-stats", mdw.AuthMiddleware(), h.GetEducationStats)

	public := r.App.Group("/api/public").Use(mdw.AuthMiddleware())
	{
		public.POST("", mdw.PermissionMiddleware("publics", "create"), h.AddPublic)
		public.GET("/:id", h.GetPublicById)
		public.PUT("/:id", mdw.PermissionMiddleware("publics", "update"), h.UpdatePublic)
		public.DELETE("/:id", mdw.PermissionMiddleware("publics", "delete"), h.DeletePublic)
	}
}

func (r *Routes) ProvinceRoutes() {
	svc := provinsiSvc.NewProvinceService()
	h := provinceHandler.NewProvinceHandler(svc)

	province := r.App.Group("/api/province")
	{
		province.GET("", h.GetProvince)
	}
}

func (r *Routes) CityRoutes() {
	svc := kabupatenSvc.NewCityService()
	h := cityHandler.NewKabupatenHandler(svc)

	city := r.App.Group("/api/city")
	{
		city.GET("", h.GetCity)
	}
}

func (r *Routes) DistrictRoutes() {
	svc := kecamatanSvc.NewKecamatanService()
	h := districtHandler.NewDistrictHandler(svc)

	district := r.App.Group("/api/district")
	{
		district.GET("", h.GetDistrict)
	}
}

func (r *Routes) AccidentRoutes() {
	// Initialize storage provider (MinIO or R2) from infrastructure
	storageProvider, err := media.InitStorage()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, "Failed to initialize storage provider: "+err.Error())
		panic("Failed to initialize storage provider: " + err.Error())
	}

	repo := accidentRepo.NewAccidentRepo(r.DB)
	svc := accidentSvc.NewAccidentService(repo, storageProvider)
	h := accidentHandler.NewAccidentHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	r.App.GET("/api/accidents", mdw.AuthMiddleware(), h.FetchAccident)
	accident := r.App.Group("/api/accident").Use(mdw.AuthMiddleware())
	{
		accident.POST("", mdw.PermissionMiddleware("accidents", "create"), h.AddAccident)
		accident.GET("/:id", h.GetAccidentById)
		accident.PUT("/:id", mdw.PermissionMiddleware("accidents", "update"), h.UpdateAccident)
		accident.DELETE("/:id", mdw.PermissionMiddleware("accidents", "delete"), h.DeleteAccident)

		// Photo endpoints
		accident.POST("/:id/photos", mdw.PermissionMiddleware("accidents", "update"), h.AddAccidentPhotos)
		accident.DELETE("/photo/:photoId", mdw.PermissionMiddleware("accidents", "delete"), h.DeleteAccidentPhoto)
	}
}

func (r *Routes) EventRoutes() {
	// Initialize storage provider (MinIO or R2) from infrastructure
	storageProvider, err := media.InitStorage()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, "Failed to initialize storage provider: "+err.Error())
		panic("Failed to initialize storage provider: " + err.Error())
	}

	repo := eventRepo.NewEventRepo(r.DB)
	repoSchool := schoolRepo.NewSchoolRepo(r.DB)
	svc := eventSvc.NewEventService(repo, repoSchool, storageProvider)
	h := eventHandler.NewEventHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	r.App.GET("/api/events", mdw.AuthMiddleware(), h.FetchEvent)
	r.App.GET("/api/events/map", mdw.AuthMiddleware(), h.GetEventsForMap)
	event := r.App.Group("/api/event").Use(mdw.AuthMiddleware())
	{
		event.POST("", mdw.PermissionMiddleware("events", "create"), h.AddEvent)
		event.GET("/:id", h.GetEventById)
		event.PUT("/:id", mdw.PermissionMiddleware("events", "update"), h.UpdateEvent)
		event.DELETE("/:id", mdw.PermissionMiddleware("events", "delete"), h.DeleteEvent)

		// Photo endpoints
		event.POST("/:id/photos", mdw.PermissionMiddleware("events", "update"), h.AddEventPhotos)
		event.DELETE("/photo/:photoId", mdw.PermissionMiddleware("events", "delete"), h.DeleteEventPhoto)
	}
}

func (r *Routes) BudgetRoutes() {
	repo := budgetRepo.NewBudgetRepo(r.DB)
	svc := budgetSvc.NewBudgetService(repo)
	h := budgetHandler.NewBudgetHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	// Summary endpoints (read-only for all authenticated users)
	r.App.GET("/api/budget/summary/event/:eventId", mdw.AuthMiddleware(), h.GetEventSummary)
	r.App.GET("/api/budget/summary/monthly", mdw.AuthMiddleware(), h.GetMonthlySummary)
	r.App.GET("/api/budget/summary/yearly", mdw.AuthMiddleware(), h.GetYearlySummary)

	// List endpoints
	r.App.GET("/api/budgets", mdw.AuthMiddleware(), h.FetchBudget)
	r.App.GET("/api/budgets/event/:eventId", mdw.AuthMiddleware(), h.GetBudgetsByEvent)
	r.App.GET("/api/budgets/month-year", mdw.AuthMiddleware(), h.GetBudgetsByMonthYear)

	// CRUD endpoints (admin/staff only)
	budget := r.App.Group("/api/budget").Use(mdw.AuthMiddleware())
	{
		budget.POST("", mdw.PermissionMiddleware("budgets", "create"), h.AddBudget)
		budget.GET("/:id", h.GetBudgetById)
		budget.PUT("/:id", mdw.PermissionMiddleware("budgets", "update"), h.UpdateBudget)
		budget.DELETE("/:id", mdw.PermissionMiddleware("budgets", "delete"), h.DeleteBudget)
	}
}

func (r *Routes) MarketShareRoutes() {
	repo := marketshareRepo.NewMarketShareRepository(r.DB)
	svc := marketshareSvc.NewMarketShareService(repo)
	h := marketshareHandler.NewMarketShareHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	// Dashboard endpoint (read-only for all authenticated users)
	r.App.GET("/api/marketshare/top-districts", mdw.AuthMiddleware(), h.GetTopDistricts)
	r.App.GET("/api/marketshare/summary", mdw.AuthMiddleware(), h.GetSummary)
	r.App.GET("/api/marketshare/dashboard-suggestions", mdw.AuthMiddleware(), h.GetDashboardSuggestions)

	// List endpoints
	r.App.GET("/api/marketshares", mdw.AuthMiddleware(), h.FetchMarketShare)

	// CRUD endpoints (admin/staff only)
	marketshare := r.App.Group("/api/marketshare").Use(mdw.AuthMiddleware())
	{
		marketshare.POST("", mdw.PermissionMiddleware("market_shares", "create"), h.AddMarketShare)
		marketshare.GET("/:id", h.GetMarketShareById)
		marketshare.PUT("/:id", mdw.PermissionMiddleware("market_shares", "update"), h.UpdateMarketShare)
		marketshare.DELETE("/:id", mdw.PermissionMiddleware("market_shares", "delete"), h.DeleteMarketShare)
	}
}

func (r *Routes) RoleRoutes() {
	repoRole := roleRepo.NewRoleRepo(r.DB)
	repoPermission := permissionRepo.NewPermissionRepo(r.DB)
	repoMenu := menuRepo.NewMenuRepo(r.DB)
	svc := roleSvc.NewRoleService(repoRole, repoPermission, repoMenu)
	h := roleHandler.NewRoleHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, repoPermission)

	// List endpoints
	r.App.GET("/api/roles", mdw.AuthMiddleware(), mdw.PermissionMiddleware("roles", "view"), h.GetAll)

	// CRUD endpoints
	role := r.App.Group("/api/role").Use(mdw.AuthMiddleware())
	{
		role.POST("", mdw.PermissionMiddleware("roles", "create"), h.Create)
		role.GET("/:id", mdw.PermissionMiddleware("roles", "view"), h.GetByID)
		role.PUT("/:id", mdw.PermissionMiddleware("roles", "update"), h.Update)
		role.DELETE("/:id", mdw.PermissionMiddleware("roles", "delete"), h.Delete)

		// Permission and menu assignment
		role.POST("/:id/permissions", mdw.PermissionMiddleware("roles", "assign_permissions"), h.AssignPermissions)
		role.POST("/:id/menus", mdw.PermissionMiddleware("roles", "assign_menus"), h.AssignMenus)
	}
}

func (r *Routes) PermissionRoutes() {
	repo := permissionRepo.NewPermissionRepo(r.DB)
	svc := permissionSvc.NewPermissionService(repo)
	h := permissionHandler.NewPermissionHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, repo)

	// List endpoints
	r.App.GET("/api/permissions", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin), h.GetAll)

	// Get current user's permissions
	r.App.GET("/api/permissions/me", mdw.AuthMiddleware(), h.GetUserPermissions)

	// CRUD endpoints (admin only)
	permission := r.App.Group("/api/permission").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin))
	{
		permission.POST("", h.Create)
		permission.GET("/:id", h.GetByID)
		permission.PUT("/:id", h.Update)
		permission.DELETE("/:id", h.Delete)
	}
}

func (r *Routes) MenuRoutes() {
	repo := menuRepo.NewMenuRepo(r.DB)
	svc := menuSvc.NewMenuService(repo)
	h := menuHandler.NewMenuHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	// Public endpoints for authenticated users
	r.App.GET("/api/menus/active", mdw.AuthMiddleware(), h.GetActiveMenus)
	r.App.GET("/api/menus/me", mdw.AuthMiddleware(), h.GetUserMenus)

	// List endpoints (admin only)
	r.App.GET("/api/menus", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin), h.GetAll)

	// CRUD endpoints (admin only)
	menu := r.App.Group("/api/menu").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin))
	{
		menu.POST("", h.Create)
		menu.GET("/:id", h.GetByID)
		menu.PUT("/:id", h.Update)
		menu.DELETE("/:id", h.Delete)
	}
}

func (r *Routes) SessionRoutes() {
	// Check if Redis is available
	redisClient := database.GetRedisClient()
	if redisClient == nil {
		logger.WriteLog(logger.LogLevelDebug, "Redis not available, session routes will not be registered")
		return
	}

	repo := sessionRepo.NewSessionRepository(redisClient)
	svc := sessionSvc.NewSessionService(repo)
	h := sessionHandler.NewSessionHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	// Session management endpoints (authenticated users only)
	sessionGroup := r.App.Group("/api/user").Use(mdw.AuthMiddleware())
	{
		sessionGroup.GET("/sessions", h.GetActiveSessions)
		sessionGroup.DELETE("/session/:session_id", h.RevokeSession)
		sessionGroup.POST("/sessions/revoke-others", h.RevokeAllOtherSessions)
	}

	logger.WriteLog(logger.LogLevelInfo, "Session management routes registered")
}

func (r *Routes) PoldaRoutes() {
	repo := poldaRepo.NewPoldaAccidentRepo(r.DB)
	svc := poldaSvc.NewPoldaAccidentService(repo)
	h := poldaHandler.NewPoldaAccidentHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	r.App.GET("/api/polda-accidents", mdw.AuthMiddleware(), mdw.PermissionMiddleware("polda_accidents", "list"), h.GetAll)
	polda := r.App.Group("/api/polda-accident").Use(mdw.AuthMiddleware())
	{
		polda.POST("", mdw.PermissionMiddleware("polda_accidents", "create"), h.Create)
		polda.GET("/:id", mdw.PermissionMiddleware("polda_accidents", "view"), h.GetByID)
		polda.PUT("/:id", mdw.PermissionMiddleware("polda_accidents", "update"), h.Update)
		polda.DELETE("/:id", mdw.PermissionMiddleware("polda_accidents", "delete"), h.Delete)
	}
}

func (r *Routes) DashboardRoutes() {
	dashboardRepo := repodashboard.NewDashboardRepo(r.DB)
	dashboardService := dashboardSvc.NewDashboardService(dashboardRepo)
	h := dashboardHandler.NewDashboardHandler(dashboardService)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	// Dashboard stats endpoint - aggregated statistics
	r.App.GET("/api/dashboard/stats", mdw.AuthMiddleware(), h.GetStats)
}
