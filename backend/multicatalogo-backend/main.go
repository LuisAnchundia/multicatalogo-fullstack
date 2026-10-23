package main

import (
	"context"
	"database/sql"
	_ "embed"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/redis/go-redis/v9"
	"multicatalogo-backend/cache"
	"multicatalogo-backend/config"
	"multicatalogo-backend/controllers"
	"multicatalogo-backend/repository"
	"multicatalogo-backend/routes"
	"multicatalogo-backend/service"
	"multicatalogo-backend/session"
)

//go:embed db/002_backoffice.sql
var backofficeMigration string

//go:embed db/001_init.sql
var initialSchema string

//go:embed db/003_demo_passwords.sql
var demoPasswordsMigration string

// Los datos de clase se crean únicamente en una base vacía. En local Docker ya
// ejecuta 001_init.sql, por lo que esta operación no altera el volumen actual.
func bootstrapDatabase(ctx context.Context, db *sql.DB) error {
	var exists bool
	if err := db.QueryRowContext(ctx, "SELECT to_regclass('public.usuarios') IS NOT NULL").Scan(&exists); err != nil {
		return err
	}
	if exists {
		return nil
	}
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var schema strings.Builder
	for _, line := range strings.Split(initialSchema, "\n") {
		if comment := strings.Index(line, "--"); comment >= 0 {
			line = line[:comment]
		}
		schema.WriteString(line)
		schema.WriteByte('\n')
	}
	for _, statement := range strings.Split(schema.String(), ";") {
		if strings.TrimSpace(statement) == "" {
			continue
		}
		if _, err := tx.ExecContext(ctx, statement); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	var db *sql.DB
	var err error
	for {
		db, err = config.NewPostgres(ctx)
		if err == nil {
			break
		}
		if ctx.Err() != nil {
			slog.Error("PostgreSQL no disponible", "error", err)
			os.Exit(1)
		}
		slog.Warn("Esperando PostgreSQL", "error", err)
		time.Sleep(2 * time.Second)
	}
	defer db.Close()
	if err := bootstrapDatabase(ctx, db); err != nil {
		slog.Error("No se pudo inicializar la base de datos", "error", err)
		os.Exit(1)
	}
	for _, statement := range strings.Split(backofficeMigration, ";") {
		if strings.TrimSpace(statement) == "" {
			continue
		}
		if _, err := db.ExecContext(ctx, statement); err != nil {
			slog.Error("No se pudo aplicar la migración de back-office", "error", err)
			os.Exit(1)
		}
	}
	if _, err := db.ExecContext(ctx, demoPasswordsMigration); err != nil {
		slog.Error("No se pudieron actualizar las contraseñas de prueba", "error", err)
		os.Exit(1)
	}
	var redisClient *redis.Client
	for {
		redisClient, err = config.NewRedis(ctx)
		if err == nil {
			break
		}
		if ctx.Err() != nil {
			slog.Error("Redis no disponible", "error", err)
			os.Exit(1)
		}
		slog.Warn("Esperando Redis", "error", err)
		time.Sleep(2 * time.Second)
	}
	cancel()
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
		AllowMethods:  "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:  "Origin,Content-Type,Accept,Authorization",
		ExposeHeaders: "X-Cache",
	}))

	pg := &repository.Postgres{DB: db}
	services := service.App{DB: pg, Cache: cache.Redis{Client: redisClient}}
	routes.SetupRoutes(app, controllers.API{Service: services, Operations: pg, Tokens: session.Tokens{Secret: []byte(secret)}})
	if info, err := os.Stat("dist"); err == nil && info.IsDir() {
		app.Static("/", "dist")
		app.Get("/*", func(c *fiber.Ctx) error {
			if strings.HasPrefix(c.Path(), "/api/") {
				return c.SendStatus(fiber.StatusNotFound)
			}
			return c.SendFile("dist/index.html")
		})
	}

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
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	if err := app.Listen(":" + port); err != nil {
		slog.Error("servidor", "error", err)
		os.Exit(1)
	}
}
