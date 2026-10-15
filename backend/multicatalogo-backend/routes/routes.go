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

	// Definimos una ruta HTTP GET en "/api/productos" y la enlazamos a la función GetProductos del paquete controllers.
	app.Get("/api/productos", api.Productos)
	app.Get("/api/productos/:id", api.Producto)
	app.Get("/api/red", api.Red)
	app.Post("/api/checkout", api.Checkout)

	app.Get("/api/health", controllers.Health)
}
