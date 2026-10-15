package controllers

import (
	"errors"
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/repository"
	"strconv"
)

func (a API) Productos(c *fiber.Ctx) error {
	ps, hit, err := a.Service.Productos(c.UserContext())
	if err != nil {
		return apiError(c, 503, "No se pudo consultar el catálogo")
	}
	if hit {
		c.Set("X-Cache", "HIT")
	} else {
		c.Set("X-Cache", "MISS")
	}
	return c.JSON(ps)
}

func (a API) Producto(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id < 1 {
		return apiError(c, 400, "El ID del producto debe ser un número positivo")
	}
	p, err := a.Service.DB.Producto(c.UserContext(), id)
	if errors.Is(err, repository.ErrNotFound) {
		return apiError(c, 404, "Producto no encontrado")
	}
	if err != nil {
		return apiError(c, 503, "No se pudo consultar el producto")
	}
	return c.JSON(p)
}
