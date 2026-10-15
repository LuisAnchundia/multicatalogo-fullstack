package config

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewPostgres(ctx context.Context) (*sql.DB, error) {
	uri := os.Getenv("DATABASE_URL")
	if uri == "" {
		return nil, errors.New("DATABASE_URL es obligatoria")
	}
	db, err := sql.Open("pgx", uri)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(15)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}
