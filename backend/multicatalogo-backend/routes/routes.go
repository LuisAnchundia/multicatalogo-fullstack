// Declaramos el paquete routes, cuya única responsabilidad es registrar los endpoints de la API.
package routes

import (
	// Importamos Fiber para poder recibir y configurar la instancia principal de la aplicación.
	"github.com/gofiber/fiber/v2"
	// Importamos nuestro paquete de controladores, donde residen las funciones que se ejecutarán en cada ruta.
	"multicatalogo-backend/controllers"
)

// SetupRoutes es una función que recibe un puntero a la aplicación Fiber (*fiber.App) para inyectarle las rutas.
func SetupRoutes(app *fiber.App, api controllers.API) {
	// Definimos una ruta HTTP POST en "/api/login" y la enlazamos a la función Login del paquete controllers.
	app.Post("/api/login", api.Login)
	app.Post("/api/register", api.Register)

	// Definimos una ruta HTTP GET en "/api/productos" y la enlazamos a la función GetProductos del paquete controllers.
	app.Get("/api/productos", api.Productos)
	app.Get("/api/productos/:id", api.Producto)
	app.Get("/api/red", api.Red)
	app.Get("/api/red/mia", api.Red)
	app.Get("/api/referido/codigo", api.MyReferralCode)
	app.Post("/api/checkout", api.Checkout)
	app.Get("/api/admin/productos", api.AdminProducts)
	app.Post("/api/productos", api.SaveProduct)
	app.Put("/api/productos/:id", api.SaveProduct)
	app.Delete("/api/productos/:id", api.ProductActive)
	app.Patch("/api/productos/:id/activar", api.ProductActive)
	app.Get("/api/usuarios", api.Users)
	app.Patch("/api/usuarios/:id", api.UpdateUser)
	app.Get("/api/pedidos/mios", api.Orders)
	app.Get("/api/pedidos", api.Orders)
	app.Get("/api/pedidos/:id", api.OrderDetail)
	app.Patch("/api/pedidos/:id/estado", api.ChangeOrderState)
	app.Get("/api/comisiones/mias", api.MyCommissions)
	app.Post("/api/liquidaciones", api.Liquidate)
	app.Get("/api/liquidaciones/pendientes", api.Debts)
	app.Get("/api/liquidaciones/mias", api.Liquidations)
	app.Get("/api/liquidaciones", api.Liquidations)
	app.Get("/api/reportes/:type", api.Report)

	app.Get("/api/health", controllers.Health)
}
