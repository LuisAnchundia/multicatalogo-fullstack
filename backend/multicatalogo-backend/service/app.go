package service

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"time"

	"multicatalogo-backend/cache"
	"multicatalogo-backend/models"
	"multicatalogo-backend/repository"
)

type App struct {
	DB    repository.DBRepository
	Cache cache.Repository
}

func (a App) Productos(ctx context.Context) ([]models.Producto, bool, error) {
	const key = "productos:all"
	if raw, err := a.Cache.Get(ctx, key); err == nil {
		var ps []models.Producto
		if json.Unmarshal(raw, &ps) == nil {
			return ps, true, nil
		}
	} else if !errors.Is(err, cache.ErrMiss) {
		slog.Warn("Redis no disponible; catálogo desde PostgreSQL", "error", err)
	}
	ps, err := a.DB.Productos(ctx)
	if err != nil {
		return nil, false, err
	}
	if data, err := json.Marshal(ps); err == nil {
		if err = a.Cache.Set(ctx, key, data, 5*time.Minute); err != nil {
			slog.Warn("no se pudo guardar catálogo en Redis", "error", err)
		}
	}
	return ps, false, nil
}

func (a App) Red(ctx context.Context, email string) (*models.Referido, bool, error) {
	key := "red:tree:" + strings.ToLower(email)
	if raw, err := a.Cache.Get(ctx, key); err == nil {
		var root models.Referido
		if json.Unmarshal(raw, &root) == nil {
			return &root, true, nil
		}
	} else if !errors.Is(err, cache.ErrMiss) {
		slog.Warn("Redis no disponible; red desde PostgreSQL", "error", err)
	}
	root, err := a.DB.Red(ctx, email)
	if err != nil {
		return nil, false, err
	}
	if data, err := json.Marshal(root); err == nil {
		if err = a.Cache.Set(ctx, key, data, 10*time.Minute); err != nil {
			slog.Warn("no se pudo guardar red en Redis", "error", err)
		}
	}
	return root, false, nil
}

func (a App) Checkout(ctx context.Context, userID int64, email string, req models.CheckoutRequest) (models.PedidoConfirmado, error) {
	res, err := a.DB.Checkout(ctx, userID, email, req)
	if err != nil {
		return models.PedidoConfirmado{}, err
	}
	a.invalidate(ctx, res.Afectados)
	go a.process(res.PedidoID)
	return res.Pedido, nil
}

func (a App) invalidate(ctx context.Context, emails []string) {
	if err := a.Cache.Delete(ctx, "productos:all"); err != nil {
		slog.Warn("falló invalidación del catálogo", "error", err)
	}
	for _, email := range emails {
		key := "red:tree:" + strings.ToLower(email)
		if err := a.Cache.Delete(ctx, key); err != nil {
			slog.Warn("falló invalidación de red", "key", key, "error", err)
		}
	}
}

func (a App) process(orderID int64) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	emails, err := a.DB.ProcessCommissionJob(ctx, orderID)
	if err != nil {
		slog.Error("comisiones pendientes para reintento", "pedido", orderID, "error", err)
		return
	}
	for _, email := range emails {
		if err := a.Cache.Delete(ctx, "red:tree:"+strings.ToLower(email)); err != nil {
			slog.Warn("falló invalidación de comisión", "error", err)
		}
	}
}

// RetryPending reanuda trabajos pendientes tras un reinicio o error temporal.
func (a App) RetryPending(ctx context.Context) {
	ids, err := a.DB.PendingCommissionJobs(ctx)
	if err != nil {
		slog.Error("no se pudieron consultar comisiones pendientes", "error", err)
		return
	}
	for _, id := range ids {
		a.process(id)
	}
}
