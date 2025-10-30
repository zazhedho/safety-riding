package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"

	schoolHandler "safety-riding/internal/handlers/http/school"
	userHandler "safety-riding/internal/handlers/http/user"
	authRepo "safety-riding/internal/repositories/auth"
	schoolRepo "safety-riding/internal/repositories/school"
	userRepo "safety-riding/internal/repositories/user"
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
			userPriv.GET("/:id", mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleCashier), h.GetUserById)
			userPriv.PUT("", h.Update)
			userPriv.PUT("/change/password", h.ChangePassword)
			userPriv.DELETE("", h.Delete)
		}
	}

	r.App.GET("/api/users", mdw.AuthMiddleware(), mdw.RoleMiddleware(utils.RoleAdmin, utils.RoleCashier), h.GetAllUsers)
}

func (r *Routes) SchoolRoutes() {
	repo := schoolRepo.NewSchoolRepo(r.DB)
	svc := schoolSvc.NewSchoolService(repo)
	h := schoolHandler.NewSchoolHandler(svc)
	mdw := middlewares.NewMiddleware(authRepo.NewBlacklistRepo(r.DB))

	school := r.App.Group("/api/school").Use(mdw.AuthMiddleware())
	{
		school.POST("", h.AddSchool)
	}
}
