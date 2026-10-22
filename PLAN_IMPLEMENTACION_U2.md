# Plan y estado de implementación — MultiCatálogo U2

**Estudiante:** Luis Anchundia

**Fecha:** 22 de octubre de 2026

Este registro se basa en el código de este repositorio. El plan anterior marcaba todas las fases como completas el 16 de octubre, pero varios módulos aún no existían. Se adaptó el trabajo al esquema real, donde `usuarios.parent_id` forma la red y `comisiones` ya era una tabla persistente.

| Fase | Entrega | Implementación |
|---|---|---|
| 0 | Migración idempotente para usuarios, productos, pedidos, comisiones, liquidaciones e índices | Hecha en `db/002_backoffice.sql` |
| 1 | Registro y código de referido; rechazo de cuentas inactivas | Hecha |
| 2 | Productos administrables, borrado lógico e invalidación de caché | Hecha |
| 3 | Historial y detalle de pedidos; estados y cancelación transaccional | Hecha |
| 4 | Libro de comisiones, red propia y enlace para invitar | Hecha |
| 5 | Liquidación administrativa e historial | Hecha; no transfiere dinero real |
| 6 | Resumen y listados de ventas para el dashboard | Hecha |
| 7 | Paginación administrativa, búsqueda y autorización de rutas | Hecha; el catálogo público conserva su lectura cacheada completa |

## Comprobaciones

- [x] `go build ./...` en el backend.
- [x] `npm run build` en el frontend.
- [x] `npm run lint` sin errores (persisten tres avisos de Fast Refresh anteriores).
- [x] Prueba de API contra una base aislada `multicatalogo_smoke`: `tests/backoffice_smoke.py` pasó registro, permisos, catálogo, pedidos, cancelación, comisiones, liquidación y reportes.
- [x] Recorrido automatizado en Chromium: 9 pruebas anteriores (una ruta del test se actualizó y volvió a pasar) y 2 pruebas nuevas de registro y back-office.
- [x] `go test ./...` y `go vet ./...`.

## Cómo ejecutar

1. En la raíz del repositorio: `docker compose up -d --build`.
2. En `frontend/Practica03_ComponentesLayout_React`: `npm ci` y `npm run dev`.
3. Abrir `http://localhost:5173`.
4. Probar el administrador `admin@upse.edu.ec` y el cliente `cliente@upse.edu.ec` con la contraseña de demostración `123456`.

El backend aplica automáticamente `db/002_backoffice.sql` al arrancar. No hay que borrar el volumen de PostgreSQL. Para nuevas instalaciones se mantiene `db/001_init.sql` como semilla inicial.
