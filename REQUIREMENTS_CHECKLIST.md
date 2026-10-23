# Seguimiento de requerimientos — MultiCatálogo

**Estudiante:** Luis Anchundia

**Asignatura:** FRAMEWORK PROGRAMACIÓN WEB

**Actualizado:** 22 de octubre de 2026

## Base anterior

- [x] React con tienda, catálogo, carrito, checkout, Dashboard y Mi Red.
- [x] API Go/Fiber con PostgreSQL, Redis y token firmado.
- [x] Checkout con transacción SQL y registro de comisiones de tres niveles.
- [x] Fases 3 y 4 documentadas en `FASES_3_4.md`.

## Avance de Unidad 2

- [x] Registro de clientes y vínculo opcional por código de referido.
- [x] Bloqueo de inicio de sesión y peticiones para cuentas desactivadas.
- [x] Gestión administrativa de productos y borrado lógico.
- [x] Historial propio y administración de pedidos.
- [x] Cancelación de pedidos pendientes con devolución de stock y reversión de comisiones.
- [x] Libro consultable de comisiones y enlace personal de invitación.
- [x] Liquidaciones administrativas sin transferencia bancaria.
- [x] Reportes de ventas y dashboard conectado a la API.
- [x] Paginación administrativa y búsqueda de productos en back-office.
- [x] Migración incremental para datos existentes.

## Verificación

- [x] Backend compila con `go build ./...`.
- [x] Frontend compila con `npm run build`.
- [x] `npm run lint` termina sin errores.
- [x] Prueba integral de API y base de datos en una base aislada.
- [x] Pruebas de navegador Chromium para los flujos existentes y los nuevos.

## PWA — diagnóstico y fases de implementación

**Estado inicial:** la aplicación ya se podía instalar desde el enlace HTTPS de Render. Tenía manifiesto, iconos y service worker, pero al perder la conexión el catálogo no cargaba porque sus datos venían de la API. Al cerrar la app también podía perderse la sesión de la pestaña. La prueba de instalación existente no comprobaba la apertura sin internet.

### Fase 1. Instalación

- [x] Mantener HTTPS, manifiesto, iconos de 192 y 512 píxeles y modo `standalone`.
- [x] Conservar el botón de instalación y su ayuda breve cuando el navegador no ofrece el aviso.

### Fase 2. Interfaz disponible sin conexión

- [x] Guardar la página inicial, los archivos JS/CSS de la versión compilada y las imágenes locales del catálogo en el service worker.
- [x] Permitir abrir la app instalada después de cerrar la ventana y desconectar internet.

### Fase 3. Catálogo guardado durante 24 horas

- [x] Guardar los productos públicos tras una consulta correcta a `GET /api/productos`, con fecha de actualización.
- [x] Si falla la conexión, mostrar el último catálogo válido durante un máximo de 24 horas.
- [x] Mostrarlo solo para consulta: sin carrito, checkout ni acciones de compra hasta volver a tener conexión.
- [x] Actualizar la copia cuando se restablezca la conexión; si vence, pedir abrir el catálogo con internet.

### Fase 4. Entrada y mensajes

- [x] Ofrecer desde el acceso una ruta pública al catálogo guardado cuando no hay internet, sin guardar el token de usuario de forma permanente.
- [x] Indicar cuándo se guardaron los datos y que las compras requieren conexión.

### Fase 5. Comprobación y publicación

- [x] Verificar en Chromium de producción que se puede abrir, cerrar y reabrir sin internet con imágenes y datos guardados.
- [x] Verificar que la copia vence tras 24 horas y que no aparecen controles de compra sin conexión.
- [x] Publicar y comprobar la nueva versión en Render: enlace HTTPS, acceso y ocho productos de la API.

El catálogo debe haberse abierto al menos una vez con internet en ese dispositivo. Las demás funciones que consultan o modifican la API siguen requiriendo conexión.

## Alcance pendiente

La pasarela de cobro, el pago bancario de liquidaciones, los cierres mensuales de rango y la carga diferida del árbol no forman parte de este avance. Los datos del seed son demostrativos.
