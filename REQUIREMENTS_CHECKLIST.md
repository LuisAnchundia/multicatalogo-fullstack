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

## Alcance pendiente

La pasarela de cobro, el pago bancario de liquidaciones, los cierres mensuales de rango y la carga diferida del árbol no forman parte de este avance. Los datos del seed son demostrativos.
