package controllers

import (
	"errors"
	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/models"
	"multicatalogo-backend/repository"
	"multicatalogo-backend/session"
	"strings"
)

func (a API) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return apiError(c, 400, "JSON inválido")
	}
	req.Email = strings.TrimSpace(req.Email)
	if req.Email == "" || req.Password == "" {
		return apiError(c, 400, "Email y contraseña son obligatorios")
	}
	user, err := a.Service.DB.Authenticate(c.UserContext(), req.Email, req.Password)
	if errors.Is(err, repository.ErrNotFound) {
		return apiError(c, 401, "Credenciales incorrectas")
	}
	if err != nil {
		return apiError(c, 500, "No se pudo iniciar sesión")
	}
	token, err := a.Tokens.Issue(user)
	if err != nil {
		return apiError(c, 500, "No se pudo iniciar sesión")
	}
	return c.JSON(fiber.Map{"email": user.Email, "rol": user.Rol, "token": token})
}

func (a API) auth(c *fiber.Ctx) (session.Claims, error) {
	header := c.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return session.Claims{}, errors.New("sesión requerida")
	}
	return a.Tokens.Verify(strings.TrimPrefix(header, "Bearer "))
}
