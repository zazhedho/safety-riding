package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
	"time"
	_ "workshop-management/docs"
	"workshop-management/infrastructure/database"
	"workshop-management/internal/router"
	"workshop-management/pkg/config"
	"workshop-management/pkg/logger"
	"workshop-management/utils"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres" // driver for postgres
	_ "github.com/golang-migrate/migrate/v4/source/file"       // driver for file
	"github.com/joho/godotenv"
)

func FailOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

// @title Workshop Management API
// @version 1.0
// @description This is a sample server for a workshop management service.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url https://www.linkedin.com/in/zaidus-zhuhur/
// @contact.email zaiduszhuhur@gmail.com

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api
// @schemes http

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
func main() {
	var (
		err   error
		sqlDb *sql.DB
	)
	if timeZone, err := time.LoadLocation("Asia/Jakarta"); err != nil {
		logger.WriteLog(logger.LogLevelError, "time.LoadLocation - Error: "+err.Error())
	} else {
		time.Local = timeZone
	}

	if err = godotenv.Load(".env"); err != nil && os.Getenv("APP_ENV") == "" {
		log.Fatalf("Error app environment")
	}

	myAddr := "unknown"
	addrs, _ := net.InterfaceAddrs()
	for _, address := range addrs {
		// check the address type and if it is not a loopback the display it
		if ipNet, ok := address.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			if ipNet.IP.To4() != nil {
				myAddr = ipNet.IP.String()
				break
			}
		}
	}

	myAddr += strings.Repeat(" ", 15-len(myAddr))
	os.Setenv("ServerIP", myAddr)
	logger.WriteLog(logger.LogLevelInfo, "Server IP: "+myAddr)

	var port, appName string
	flag.StringVar(&port, "port", os.Getenv("PORT"), "port of the service")
	flag.StringVar(&appName, "appname", os.Getenv("APP_NAME"), "service name")
	flag.Parse()
	logger.WriteLog(logger.LogLevelInfo, "APP: "+appName+"; PORT: "+port)

	//Load app config
	confID := config.GetAppConf("CONFIG_ID", "", nil)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("ConfigID: %s", confID))

	runMigration()
	routes := router.NewRoutes()

	routes.DB, sqlDb, err = database.ConnDb()
	FailOnError(err, "Failed to open db")
	defer sqlDb.Close()

	routes.UserRoutes()
	routes.VehicleRoutes()
	routes.ServiceRoutes()
	routes.BookingRoutes()
	routes.WorkOrderRoutes()

	err = routes.App.Run(fmt.Sprintf(":%s", port))
	FailOnError(err, "Failed run service")
}

func runMigration() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
			utils.GetEnv("DB_USERNAME", "").(string),
			utils.GetEnv("DB_PASS", "").(string),
			utils.GetEnv("DB_HOST", "").(string),
			utils.GetEnv("DB_PORT", "").(string),
			utils.GetEnv("DB_NAME", "").(string),
			utils.GetEnv("DB_SSLMODE", "disable").(string))
	}

	m, err := migrate.New(utils.GetEnv("PATH_MIGRATE", "file://migrations").(string), dsn)
	if err != nil {
		log.Fatal(err)
	}

	if err := m.Up(); err != nil && err.Error() != "no change" {
		log.Fatal(err)
	}
	logger.WriteLog(logger.LogLevelInfo, "Migration Success")
}
