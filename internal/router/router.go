package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"

	"safety-riding/infrastructure/database"
	"safety-riding/infrastructure/media"
	accidentHandler "safety-riding/internal/handlers/http/accident"
	budgetHandler "safety-riding/internal/handlers/http/budget"
	cityHandler "safety-riding/internal/handlers/http/city"
	districtHandler "safety-riding/internal/handlers/http/district"
	eventHandler "safety-riding/internal/handlers/http/event"
	marketshareHandler "safety-riding/internal/handlers/http/marketshare"
	menuHandler "safety-riding/internal/handlers/http/menu"
	permissionHandler "safety-riding/internal/handlers/http/permission"
	provinceHandler "safety-riding/internal/handlers/http/province"
	roleHandler "safety-riding/internal/handlers/http/role"
	schoolHandler "safety-riding/internal/handlers/http/school"
	sessionHandler "safety-riding/internal/handlers/http/session"
	userHandler "safety-riding/internal/handlers/http/user"
	accidentRepo "safety-riding/internal/repositories/accident"
	authRepo "safety-riding/internal/repositories/auth"
	budgetRepo "safety-riding/internal/repositories/budget"
	eventRepo "safety-riding/internal/repositories/event"
	marketshareRepo "safety-riding/internal/repositories/marketshare"
	menuRepo "safety-riding/internal/repositories/menu"
	permissionRepo "safety-riding/internal/repositories/permission"
	roleRepo "safety-riding/internal/repositories/role"
	schoolRepo "safety-riding/internal/repositories/school"
	sessionRepo "safety-riding/internal/repositories/session"
	userRepo "safety-riding/internal/repositories/user"
	accidentSvc "safety-riding/internal/services/accident"
	budgetSvc "safety-riding/internal/services/budget"
	kabupatenSvc "safety-riding/internal/services/city"
	kecamatanSvc "safety-riding/internal/services/district"
	eventSvc "safety-riding/internal/services/event"
	marketshareSvc "safety-riding/internal/services/marketshare"
	menuSvc "safety-riding/internal/services/menu"
	permissionSvc "safety-riding/internal/services/permission"
	provinsiSvc "safety-riding/internal/services/province"
	roleSvc "safety-riding/internal/services/role"
	schoolSvc "safety-riding/internal/services/school"
	sessionSvc "safety-riding/internal/services/session"
	userSvc "safety-riding/internal/services/user"
	"safety-riding/middlewares"
	"safety-riding/pkg/logger"
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
	h := userHandler.NewUserHandler(uc)
	mdw := middlewares.NewMiddleware(blacklistRepo)

	user := r.App.Group("/api/user")
	{
		user.POST("/register", h.Register)
		user.POST("/login", h.Login)

		userPriv := user.Group("").Use(mdw.AuthMiddleware())
		{
			userPriv.POST("/logout", h.Logout)
			userPriv.GET("", h.GetUserByAuth)
			userPriv.GET("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.GetUserById)
			userPriv.PUT("", h.Update)
			userPriv.PUT("/:id", mdw.RoleMiddleware(utils.RoleAdmin), h.UpdateUserById)
			userPriv.PUT("/change/password", h.ChangePassword)
			userPriv.DELETE("", h.Delete)
			userPriv.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin), h.DeleteUserById)
		}
	}

	r.App.GET("/api/users", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleSuperAdmin, utils.RoleAdmin, utils.RoleStaff), h.GetAllUsers)
}

func (r *Routes) SchoolRoutes() {
	repo := schoolRepo.NewSchoolRepo(r.DB)
	svc := schoolSvc.NewSchoolService(repo)
	h := schoolHandler.NewSchoolHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	r.App.GET("/api/schools", mdw.AuthMiddleware(), h.FetchSchool)
	r.App.GET("/api/schools/education-stats", mdw.AuthMiddleware(), h.GetEducationStats)

	school := r.App.Group("/api/school").Use(mdw.AuthMiddleware())
	{
		school.POST("", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.AddSchool)
		school.GET("/:id", h.GetSchoolById)
		school.PUT("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.UpdateSchool)
		school.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.DeleteSchool)
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
	repo := accidentRepo.NewAccidentRepo(r.DB)
	svc := accidentSvc.NewAccidentService(repo)
	h := accidentHandler.NewAccidentHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	r.App.GET("/api/accidents", mdw.AuthMiddleware(), h.FetchAccident)
	accident := r.App.Group("/api/accident").Use(mdw.AuthMiddleware())
	{
		accident.POST("", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.AddAccident)
		accident.GET("/:id", h.GetAccidentById)
		accident.PUT("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.UpdateAccident)
		accident.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.DeleteAccident)
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
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	r.App.GET("/api/events", mdw.AuthMiddleware(), h.FetchEvent)
	event := r.App.Group("/api/event").Use(mdw.AuthMiddleware())
	{
		event.POST("", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.AddEvent)
		event.GET("/:id", h.GetEventById)
		event.PUT("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.UpdateEvent)
		event.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.DeleteEvent)

		// Photo endpoints
		event.POST("/:id/photos", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.AddEventPhotos)
		event.DELETE("/photo/:photoId", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.DeleteEventPhoto)
	}
}

func (r *Routes) BudgetRoutes() {
	repo := budgetRepo.NewBudgetRepo(r.DB)
	svc := budgetSvc.NewBudgetService(repo)
	h := budgetHandler.NewBudgetHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

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
		budget.POST("", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.AddBudget)
		budget.GET("/:id", h.GetBudgetById)
		budget.PUT("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.UpdateBudget)
		budget.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.DeleteBudget)
	}
}

func (r *Routes) MarketShareRoutes() {
	repo := marketshareRepo.NewMarketShareRepository(r.DB)
	svc := marketshareSvc.NewMarketShareService(repo)
	h := marketshareHandler.NewMarketShareHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	// Dashboard endpoint (read-only for all authenticated users)
	r.App.GET("/api/marketshare/top-districts", mdw.AuthMiddleware(), h.GetTopDistricts)
	r.App.GET("/api/marketshare/summary", mdw.AuthMiddleware(), h.GetSummary)
	r.App.GET("/api/marketshare/dashboard-suggestions", mdw.AuthMiddleware(), h.GetDashboardSuggestions)

	// List endpoints
	r.App.GET("/api/marketshares", mdw.AuthMiddleware(), h.FetchMarketShare)

	// CRUD endpoints (admin/staff only)
	marketshare := r.App.Group("/api/marketshare").Use(mdw.AuthMiddleware())
	{
		marketshare.POST("", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.AddMarketShare)
		marketshare.GET("/:id", h.GetMarketShareById)
		marketshare.PUT("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.UpdateMarketShare)
		marketshare.DELETE("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.DeleteMarketShare)
	}
}

func (r *Routes) RoleRoutes() {
	repoRole := roleRepo.NewRoleRepo(r.DB)
	repoPermission := permissionRepo.NewPermissionRepo(r.DB)
	repoMenu := menuRepo.NewMenuRepo(r.DB)
	svc := roleSvc.NewRoleService(repoRole, repoPermission, repoMenu)
	h := roleHandler.NewRoleHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	// List endpoints
	r.App.GET("/api/roles", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin), h.GetAll)

	// CRUD endpoints (admin only)
	role := r.App.Group("/api/role").Use(mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin))
	{
		role.POST("", h.Create)
		role.GET("/:id", h.GetByID)
		role.PUT("/:id", h.Update)
		role.DELETE("/:id", h.Delete)

		// Permission and menu assignment
		role.POST("/:id/permissions", h.AssignPermissions)
		role.POST("/:id/menus", h.AssignMenus)
	}
}

func (r *Routes) PermissionRoutes() {
	repo := permissionRepo.NewPermissionRepo(r.DB)
	svc := permissionSvc.NewPermissionService(repo)
	h := permissionHandler.NewPermissionHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

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
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

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
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	// Session management endpoints (authenticated users only)
	sessionGroup := r.App.Group("/api/user").Use(mdw.AuthMiddleware())
	{
		sessionGroup.GET("/sessions", h.GetActiveSessions)
		sessionGroup.DELETE("/session/:session_id", h.RevokeSession)
		sessionGroup.POST("/sessions/revoke-others", h.RevokeAllOtherSessions)
	}

	logger.WriteLog(logger.LogLevelInfo, "Session management routes registered")
}
