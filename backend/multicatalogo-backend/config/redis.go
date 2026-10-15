package config

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

// NewRedis lee REDIS_URL y verifica la conexión al iniciar.
func NewRedis(ctx context.Context) (*redis.Client, error) {
	uri := os.Getenv("REDIS_URL")
	if uri == "" {
		uri = "redis://localhost:6379/0"
	}
	opts, err := redis.ParseURL(uri)
	if err != nil {
		return nil, fmt.Errorf("REDIS_URL: %w", err)
	}
	opts.DialTimeout = 3 * time.Second
	client := redis.NewClient(opts)
	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, fmt.Errorf("conexión Redis: %w", err)
	}
	return client, nil
}
