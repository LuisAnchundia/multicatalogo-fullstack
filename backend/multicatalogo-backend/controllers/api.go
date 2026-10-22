package controllers

import (
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
	"multicatalogo-backend/repository"
	"multicatalogo-backend/service"
	"multicatalogo-backend/session"
)

type API struct {
	Service    service.App
	Operations *repository.Postgres
	Tokens     session.Tokens
}

func apiError(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(models.APIError{Status: status, Message: message, Error: message})
}
