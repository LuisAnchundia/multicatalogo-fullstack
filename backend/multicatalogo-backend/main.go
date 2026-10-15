package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"multicatalogo-backend/cache"
	"multicatalogo-backend/config"
	"multicatalogo-backend/controllers"
	"multicatalogo-backend/repository"
	"multicatalogo-backend/routes"
	"multicatalogo-backend/service"
	"multicatalogo-backend/session"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	db, err := config.NewPostgres(ctx)
	if err != nil {
		slog.Error("PostgreSQL no disponible", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	redisClient, err := config.NewRedis(ctx)
	cancel()
	if err != nil {
		slog.Error("Redis no disponible", "error", err)
		os.Exit(1)
	}
	defer redisClient.Close()

	secret := os.Getenv("TOKEN_SECRET")
	if len(secret) < 32 {
		slog.Error("TOKEN_SECRET debe tener al menos 32 caracteres")
		os.Exit(1)
	}
	allowed := os.Getenv("APP_ORIGINS")
	if allowed == "" {
		allowed = "http://localhost:5173,http://127.0.0.1:5173"
	}
	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins:  strings.Join(strings.Split(allowed, ","), ","),
		AllowMethods:  "GET,POST,OPTIONS",
		AllowHeaders:  "Origin,Content-Type,Accept,Authorization",
		ExposeHeaders: "X-Cache",
	}))

	services := service.App{DB: &repository.Postgres{DB: db}, Cache: cache.Redis{Client: redisClient}}
	routes.SetupRoutes(app, controllers.API{Service: services, Tokens: session.Tokens{Secret: []byte(secret)}})

	stopWorker := make(chan struct{})
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for {
			ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
			services.RetryPending(ctx)
			cancel()
			select {
			case <-ticker.C:
			case <-stopWorker:
				return
			}
		}
	}()

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-signals
		close(stopWorker)
		if err := app.Shutdown(); err != nil {
			slog.Error("apagado", "error", err)
		}
	}()
	if err := app.Listen(":3000"); err != nil {
		slog.Error("servidor", "error", err)
		os.Exit(1)
	}
}
