package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"

	"safety-riding/infrastructure/media"
	accidentHandler "safety-riding/internal/handlers/http/accident"
	budgetHandler "safety-riding/internal/handlers/http/budget"
	cityHandler "safety-riding/internal/handlers/http/city"
	districtHandler "safety-riding/internal/handlers/http/district"
	eventHandler "safety-riding/internal/handlers/http/event"
	provinceHandler "safety-riding/internal/handlers/http/province"
	schoolHandler "safety-riding/internal/handlers/http/school"
	userHandler "safety-riding/internal/handlers/http/user"
	accidentRepo "safety-riding/internal/repositories/accident"
	authRepo "safety-riding/internal/repositories/auth"
	budgetRepo "safety-riding/internal/repositories/budget"
	eventRepo "safety-riding/internal/repositories/event"
	schoolRepo "safety-riding/internal/repositories/school"
	userRepo "safety-riding/internal/repositories/user"
	accidentSvc "safety-riding/internal/services/accident"
	budgetSvc "safety-riding/internal/services/budget"
	kabupatenSvc "safety-riding/internal/services/city"
	kecamatanSvc "safety-riding/internal/services/district"
	eventSvc "safety-riding/internal/services/event"
	provinsiSvc "safety-riding/internal/services/province"
	schoolSvc "safety-riding/internal/services/school"
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
	uc := userSvc.NewUserService(repo, blacklistRepo)
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

	r.App.GET("/api/users", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleStaff), h.GetAllUsers)
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
	// Initialize MinIO client from infrastructure
	minioClient, err := media.InitMinio()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, "Failed to initialize MinIO client: "+err.Error())
		panic("Failed to initialize MinIO client: " + err.Error())
	}

	repo := eventRepo.NewEventRepo(r.DB)
	repoSchool := schoolRepo.NewSchoolRepo(r.DB)
	svc := eventSvc.NewEventService(repo, repoSchool, minioClient)
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
