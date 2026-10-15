package controllers

import "github.com/gofiber/fiber/v2"

// Health informa que el servidor está operativo.
func Health(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "ok",
		"message": "Servidor Go/Fiber operativo",
	})
}
