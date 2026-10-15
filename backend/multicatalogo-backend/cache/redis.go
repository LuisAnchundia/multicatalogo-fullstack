package cache

import (
	"context"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrMiss = errors.New("clave no encontrada en caché")

type Repository interface {
	Get(context.Context, string) ([]byte, error)
	Set(context.Context, string, []byte, time.Duration) error
	Delete(context.Context, string) error
}

type Redis struct{ Client *redis.Client }

func (r Redis) Get(ctx context.Context, key string) ([]byte, error) {
	data, err := r.Client.Get(ctx, key).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, ErrMiss
	}
	return data, err
}
func (r Redis) Set(ctx context.Context, key string, data []byte, ttl time.Duration) error {
	return r.Client.Set(ctx, key, data, ttl).Err()
}
func (r Redis) Delete(ctx context.Context, key string) error { return r.Client.Del(ctx, key).Err() }
