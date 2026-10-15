package controllers

import (
	"errors"
	"github.com/gofiber/fiber/v2"
	"log/slog"
	"multicatalogo-backend/models"
	"multicatalogo-backend/repository"
	"net/mail"
	"strings"
)

func (a API) Checkout(c *fiber.Ctx) error {
	claims, err := a.auth(c)
	if err != nil {
		return apiError(c, 401, "Sesión inválida o vencida")
	}
	var req models.CheckoutRequest
	if err = c.BodyParser(&req); err != nil {
		return apiError(c, 400, "JSON inválido")
	}
	cl := &req.Cliente
	cl.Nombre = strings.TrimSpace(cl.Nombre)
	cl.Email = strings.TrimSpace(cl.Email)
	cl.Direccion = strings.TrimSpace(cl.Direccion)
	cl.Ciudad = strings.TrimSpace(cl.Ciudad)
	cl.Telefono = strings.TrimSpace(cl.Telefono)
	if cl.Nombre == "" || cl.Email == "" || cl.Direccion == "" || cl.Ciudad == "" || cl.Telefono == "" {
		return apiError(c, 400, "Completa todos los datos del cliente")
	}
	address, err := mail.ParseAddress(cl.Email)
	if err != nil || address.Address != cl.Email || len(cl.Telefono) < 7 || len(cl.Telefono) > 20 {
		return apiError(c, 400, "Correo o teléfono inválido")
	}
	allowed := map[string]bool{"Tarjeta de crédito": true, "Transferencia bancaria": true, "Efectivo contra entrega": true}
	if !allowed[req.MetodoPago] {
		return apiError(c, 400, "Método de pago inválido")
	}
	if len(req.Items) == 0 || len(req.Items) > 50 {
		return apiError(c, 400, "El carrito debe contener entre 1 y 50 productos")
	}
	seen := map[int64]bool{}
	for _, item := range req.Items {
		if item.ID < 1 || item.Cantidad < 1 || item.Cantidad > 100 || seen[item.ID] {
			return apiError(c, 400, "Items del carrito inválidos")
		}
		seen[item.ID] = true
	}
	order, err := a.Service.Checkout(c.UserContext(), claims.ID, claims.Email, req)
	if errors.Is(err, repository.ErrInvalid) {
		return apiError(c, 400, "El carrito contiene un producto inexistente")
	}
	if errors.Is(err, repository.ErrStock) {
		return apiError(c, 400, "Stock insuficiente para completar el pedido")
	}
	if err != nil {
		slog.Error("checkout falló y se revirtió", "error", err)
		return apiError(c, 500, "No se pudo registrar el pedido; no se realizó ningún cobro")
	}
	return c.Status(fiber.StatusCreated).JSON(order)
}
