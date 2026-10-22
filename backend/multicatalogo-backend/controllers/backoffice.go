package controllers

import (
	"errors"
	"log/slog"
	"net/mail"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"multicatalogo-backend/repository"
	"multicatalogo-backend/session"
)

func (a API) invalidateRed(c *fiber.Ctx, emails []string) {
	for _, email := range emails {
		if err := a.Service.Cache.Delete(c.UserContext(), "red:tree:"+strings.ToLower(email)); err != nil {
			slog.Warn("no se pudo invalidar red", "error", err)
		}
	}
}

func (a API) requireAdmin(c *fiber.Ctx) (session.Claims, error) {
	claims, err := a.auth(c)
	if err != nil {
		_ = apiError(c, 401, "Sesión inválida o vencida")
		return claims, err
	}
	if claims.Rol != "admin" {
		_ = apiError(c, 403, "Solo el administrador puede realizar esta acción")
		return claims, repository.ErrForbidden
	}
	return claims, nil
}
func idParam(c *fiber.Ctx) (int, error) {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id < 1 {
		return 0, repository.ErrInvalid
	}
	return id, nil
}
func pageParams(c *fiber.Ctx) (int, int) {
	p, _ := strconv.Atoi(c.Query("page", "1"))
	l, _ := strconv.Atoi(c.Query("limit", "10"))
	return p, l
}
func operationError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, repository.ErrInvalid):
		return apiError(c, 400, "Datos o transición inválidos")
	case errors.Is(err, repository.ErrConflict):
		return apiError(c, 409, "El recurso ya existe o no se puede cambiar")
	case errors.Is(err, repository.ErrForbidden):
		return apiError(c, 403, "No tienes acceso a este recurso")
	case errors.Is(err, repository.ErrNotFound):
		return apiError(c, 404, "Recurso no encontrado")
	default:
		return apiError(c, 500, "No se pudo completar la operación")
	}
}
func (a API) Register(c *fiber.Ctx) error {
	var in repository.RegisterInput
	if err := c.BodyParser(&in); err != nil {
		return apiError(c, 400, "JSON inválido")
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	addr, err := mail.ParseAddress(in.Email)
	if err != nil || addr.Address != in.Email {
		return apiError(c, 400, "Correo inválido")
	}
	if in.Ref == "" {
		in.Ref = c.Query("ref")
	}
	user, err := a.Operations.Register(c.UserContext(), in)
	if err != nil {
		return operationError(c, err)
	}
	if emails, e := a.Operations.AffectedEmails(c.UserContext(), user.ID); e == nil {
		a.invalidateRed(c, emails)
	}
	return c.Status(201).JSON(user)
}
func (a API) MyReferralCode(c *fiber.Ctx) error {
	claims, err := a.auth(c)
	if err != nil {
		return apiError(c, 401, "Sesión inválida")
	}
	code, err := a.Operations.ReferralCode(c.UserContext(), claims.ID)
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(fiber.Map{"codigo": code})
}
func (a API) Users(c *fiber.Ctx) error {
	if _, err := a.requireAdmin(c); err != nil {
		return nil
	}
	page, limit := pageParams(c)
	data, err := a.Operations.Users(c.UserContext(), page, limit)
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(data)
}
func (a API) UpdateUser(c *fiber.Ctx) error {
	claims, err := a.requireAdmin(c)
	if err != nil {
		return nil
	}
	id, err := idParam(c)
	if err != nil {
		return operationError(c, err)
	}
	var input struct {
		Rol    string `json:"rol"`
		Activo bool   `json:"activo"`
	}
	if err = c.BodyParser(&input); err != nil {
		return apiError(c, 400, "JSON inválido")
	}
	if int64(id) == claims.ID && (!input.Activo || input.Rol != "admin") {
		return apiError(c, 400, "No puedes desactivar tu propia cuenta de administrador")
	}
	if err = a.Operations.UpdateUser(c.UserContext(), int64(id), input.Rol, input.Activo); err != nil {
		return operationError(c, err)
	}
	return c.SendStatus(204)
}
func (a API) AdminProducts(c *fiber.Ctx) error {
	if _, err := a.requireAdmin(c); err != nil {
		return nil
	}
	page, limit := pageParams(c)
	data, err := a.Operations.AdminProducts(c.UserContext(), page, limit, c.Query("q"))
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(data)
}
func (a API) SaveProduct(c *fiber.Ctx) error {
	if _, err := a.requireAdmin(c); err != nil {
		return nil
	}
	id := 0
	if c.Method() == fiber.MethodPut {
		var err error
		id, err = idParam(c)
		if err != nil {
			return operationError(c, err)
		}
	}
	var in repository.ProductInput
	if err := c.BodyParser(&in); err != nil {
		return apiError(c, 400, "JSON inválido")
	}
	data, err := a.Operations.SaveProduct(c.UserContext(), id, in)
	if err != nil {
		return operationError(c, err)
	}
	if err = a.Service.Cache.Delete(c.UserContext(), "productos:all"); err != nil {
		slog.Warn("no se pudo invalidar catálogo", "error", err)
	}
	if id == 0 {
		return c.Status(201).JSON(data)
	}
	return c.JSON(data)
}
func (a API) ProductActive(c *fiber.Ctx) error {
	if _, err := a.requireAdmin(c); err != nil {
		return nil
	}
	id, err := idParam(c)
	if err != nil {
		return operationError(c, err)
	}
	active := c.Method() != fiber.MethodDelete
	if err = a.Operations.SetProductActive(c.UserContext(), id, active); err != nil {
		return operationError(c, err)
	}
	_ = a.Service.Cache.Delete(c.UserContext(), "productos:all")
	return c.SendStatus(204)
}
func (a API) Orders(c *fiber.Ctx) error {
	claims, err := a.auth(c)
	if err != nil {
		return apiError(c, 401, "Sesión inválida")
	}
	admin := c.Path() == "/api/pedidos"
	if admin && claims.Rol != "admin" {
		return apiError(c, 403, "Solo el administrador puede ver todos los pedidos")
	}
	page, limit := pageParams(c)
	data, err := a.Operations.Orders(c.UserContext(), claims.ID, admin, c.Query("estado"), page, limit)
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(data)
}
func (a API) OrderDetail(c *fiber.Ctx) error {
	claims, err := a.auth(c)
	if err != nil {
		return apiError(c, 401, "Sesión inválida")
	}
	id, err := idParam(c)
	if err != nil {
		return operationError(c, err)
	}
	data, err := a.Operations.OrderDetail(c.UserContext(), int64(id), claims.ID, claims.Rol == "admin")
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(data)
}
func (a API) ChangeOrderState(c *fiber.Ctx) error {
	if _, err := a.requireAdmin(c); err != nil {
		return nil
	}
	id, err := idParam(c)
	if err != nil {
		return operationError(c, err)
	}
	var in struct {
		Estado string `json:"estado"`
	}
	if err = c.BodyParser(&in); err != nil {
		return apiError(c, 400, "JSON inválido")
	}
	if err = a.Operations.SetOrderState(c.UserContext(), int64(id), in.Estado); err != nil {
		return operationError(c, err)
	}
	_ = a.Service.Cache.Delete(c.UserContext(), "productos:all")
	if emails, e := a.Operations.OrderAffectedEmails(c.UserContext(), int64(id)); e == nil {
		a.invalidateRed(c, emails)
	}
	return c.SendStatus(204)
}
func (a API) MyCommissions(c *fiber.Ctx) error {
	claims, err := a.auth(c)
	if err != nil {
		return apiError(c, 401, "Sesión inválida")
	}
	data, err := a.Operations.Commissions(c.UserContext(), claims.ID)
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(data)
}
func (a API) Liquidate(c *fiber.Ctx) error {
	if _, err := a.requireAdmin(c); err != nil {
		return nil
	}
	var in struct {
		BeneficiarioID int64 `json:"beneficiarioId"`
	}
	if err := c.BodyParser(&in); err != nil {
		return apiError(c, 400, "JSON inválido")
	}
	if in.BeneficiarioID < 1 {
		return apiError(c, 400, "Distribuidor inválido")
	}
	data, err := a.Operations.Liquidate(c.UserContext(), in.BeneficiarioID)
	if err != nil {
		return operationError(c, err)
	}
	if emails, e := a.Operations.AffectedEmails(c.UserContext(), in.BeneficiarioID); e == nil {
		a.invalidateRed(c, emails)
	}
	return c.Status(201).JSON(data)
}
func (a API) Liquidations(c *fiber.Ctx) error {
	claims, err := a.auth(c)
	if err != nil {
		return apiError(c, 401, "Sesión inválida")
	}
	admin := c.Path() == "/api/liquidaciones"
	if admin && claims.Rol != "admin" {
		return apiError(c, 403, "Solo el administrador puede ver todas las liquidaciones")
	}
	data, err := a.Operations.Liquidations(c.UserContext(), claims.ID, admin)
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(data)
}
func (a API) Debts(c *fiber.Ctx) error {
	if _, err := a.requireAdmin(c); err != nil {
		return nil
	}
	data, err := a.Operations.Debts(c.UserContext())
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(data)
}
func (a API) Report(c *fiber.Ctx) error {
	if _, err := a.requireAdmin(c); err != nil {
		return nil
	}
	var data any
	var err error
	switch c.Params("type") {
	case "resumen":
		from := time.Time{}
		to := time.Now().Add(24 * time.Hour)
		if v := c.Query("desde"); v != "" {
			from, err = time.Parse("2006-01-02", v)
			if err != nil {
				return apiError(c, 400, "Fecha inicial inválida")
			}
		}
		if v := c.Query("hasta"); v != "" {
			to, err = time.Parse("2006-01-02", v)
			if err != nil {
				return apiError(c, 400, "Fecha final inválida")
			}
			to = to.AddDate(0, 0, 1)
		}
		data, err = a.Operations.Report(c.UserContext(), from, to)
	case "top-productos":
		data, err = a.Operations.TopProducts(c.UserContext())
	case "top-referidos":
		data, err = a.Operations.TopReferrals(c.UserContext())
	case "comisiones-pendientes":
		data, err = a.Operations.PendingByUser(c.UserContext())
	default:
		return apiError(c, 404, "Reporte inexistente")
	}
	if err != nil {
		return operationError(c, err)
	}
	return c.JSON(data)
}
