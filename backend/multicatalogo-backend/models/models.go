// Declaramos el paquete models para agrupar las estructuras de datos de la aplicación.
package models

// APIError estandariza las respuestas de error de la API.
type APIError struct {
	Status  int         `json:"status"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
	Error   string      `json:"error"`
}

// LoginRequest define la estructura esperada para el cuerpo de la petición (JSON) al iniciar sesión.
type LoginRequest struct {
	// Email representa el correo del usuario; la etiqueta `json:"email"` indica cómo se mapea el JSON a esta variable.
	Email string `json:"email"`
	// Password representa la contraseña del usuario; se extrae del campo "password" del JSON entrante.
	Password string `json:"password"`
}

// Producto define la estructura de los datos de un artículo en nuestro catálogo.
type Producto struct {
	// ID es el identificador único numérico del producto.
	ID int `json:"id"`
	// Nombre es la descripción en texto del producto.
	Nombre string `json:"nombre"`
	// Precio es el costo del producto, almacenado como un número con decimales (float64).
	Precio float64 `json:"precio"`
	// Img es la URL o ruta que apunta a la fotografía o imagen del producto.
	Img         string   `json:"img"`
	Descripcion string   `json:"descripcion"`
	Categoria   string   `json:"categoria"`
	Galeria     []string `json:"galeria"`
	Stock       int      `json:"stock"`
	Activo      bool     `json:"activo"`
}

// Usuario representa la cuenta autenticada y su lugar en la red.
type Usuario struct {
	ID       int64
	Email    string
	Nombre   string
	Rol      string
	ParentID *int64
}

type Referido struct {
	ID     int64       `json:"id"`
	Nombre string      `json:"nombre"`
	Nivel  int         `json:"nivel"`
	Ventas float64     `json:"ventas"`
	Saldo  float64     `json:"saldo,omitempty"`
	Hijos  []*Referido `json:"hijos,omitempty"`
}

type CheckoutItem struct {
	ID       int64 `json:"id"`
	Cantidad int   `json:"cantidad"`
}

type Cliente struct {
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
	Direccion string `json:"direccion"`
	Ciudad    string `json:"ciudad"`
	Telefono  string `json:"telefono"`
}

type CheckoutRequest struct {
	Cliente    Cliente        `json:"cliente"`
	MetodoPago string         `json:"metodoPago"`
	Items      []CheckoutItem `json:"items"`
}

type PedidoItem struct {
	Nombre   string  `json:"nombre"`
	Cantidad int     `json:"cantidad"`
	Precio   float64 `json:"precio"`
}

type PedidoConfirmado struct {
	Numero       string       `json:"numero"`
	UsuarioEmail string       `json:"usuarioEmail"`
	Items        []PedidoItem `json:"items"`
	Total        float64      `json:"total"`
	Cliente      Cliente      `json:"cliente"`
	MetodoPago   string       `json:"metodoPago"`
	Fecha        string       `json:"fecha"`
}
