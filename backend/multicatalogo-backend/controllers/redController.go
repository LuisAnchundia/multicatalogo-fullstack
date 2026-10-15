package controllers

import (
	"errors"
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/repository"
)

func (a API) Red(c *fiber.Ctx) error {
	claims, err := a.auth(c)
	if err != nil {
		return apiError(c, 401, "Sesión inválida o vencida")
	}
	root, hit, err := a.Service.Red(c.UserContext(), claims.Email)
	if errors.Is(err, repository.ErrNotFound) {
		return apiError(c, 404, "Usuario no encontrado")
	}
	if err != nil {
		return apiError(c, 503, "No se pudo consultar la red")
	}
	if hit {
		c.Set("X-Cache", "HIT")
	} else {
		c.Set("X-Cache", "MISS")
	}
	return c.JSON(root)
}
