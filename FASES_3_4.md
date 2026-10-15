# Fases 3 y 4 sobre MultiCatálogo

Los archivos `Fase 3.ipynb` y `Fase 4.ipynb` de la carpeta de la materia son requisitos del **mismo proyecto**, en ese orden. `FASES/Fase 1.ipynb` nombra `multicatalogo-backend` y el frontend React. En este repositorio no había una Fase 2 implementada: PostgreSQL, Redis y el repositorio de datos se agregaron aquí como base necesaria para las fases nuevas. Los notebooks originales no se modificaron.

## Fase 3: PostgreSQL + Redis

| Requisito | Archivo | Resultado |
|---|---|---|
| Infraestructura con Redis | `docker-compose.yml` | `db`, `redis:alpine` y backend con dependencias saludables |
| Cliente de Redis por URI | `backend/multicatalogo-backend/config/redis.go` | Lee `REDIS_URL` |
| Catálogo con Cache-Aside | `service/app.go` | `productos:all`, TTL de 5 minutos |
| Red con Cache-Aside | `service/app.go` | `red:tree:{email}`, TTL de 10 minutos |
| Datos persistidos | `repository/postgres.go`, `db/001_init.sql` | Ocho productos y árbol multinivel en PostgreSQL |

En las respuestas de `/api/productos` y `/api/red`, la cabecera `X-Cache` indica `MISS` en la primera lectura y `HIT` en la siguiente. Si Redis no responde durante una petición, la lectura sigue desde PostgreSQL y se registra el problema en el servidor.

## Fase 4: checkout y comisiones

| Requisito | Archivo | Resultado |
|---|---|---|
| Inyección de dependencias | `main.go`, `routes/routes.go`, `repository/postgres.go`, `cache/redis.go` | Controladores construidos con servicio y repositorios |
| `POST /api/checkout` | `controllers/checkoutController.go` | Token firmado, validación y respuesta 201 |
| ACID | `repository/postgres.go` | `BEGIN`, pedido, detalle, descuento de stock, trabajo pendiente y `COMMIT`; rollback ante cualquier error |
| Goroutine | `service/app.go` | Comisiones de niveles 1, 2 y 3 tras confirmar la compra |
| Recuperación | `commission_jobs` y trabajador en `main.go` | Reintenta trabajos pendientes después de reiniciar |
| Invalidación | `service/app.go` | Borra catálogo y redes afectadas después del pedido y de las comisiones |
| React | `Checkout.tsx`, `Confirmacion.tsx`, `MiRed.tsx`, `Dashboard.tsx` | Compra y KPIs reales, sin cobro de dinero |

Los precios se calculan en el servidor desde PostgreSQL; el cliente envía solamente IDs y cantidades. La compra usa el token de sesión como identidad del usuario. La clave `TOKEN_SECRET` del ejemplo es solo para practicar en local.

## Cómo comprobarlo

1. Desde este directorio: `docker compose up -d --build`.
2. Desde `frontend/Practica03_ComponentesLayout_React`: `npm ci`, `npm run dev` y abrir `http://localhost:5173`.
3. Entrar con `cliente@upse.edu.ec` / `123456`, comprar un producto y observar la confirmación.
4. Entrar con `admin@upse.edu.ec` / `123456`: el Dashboard y Mi Red muestran la comisión actualizada.
5. En Network, pedir dos veces `/api/productos` o `/api/red` y observar `X-Cache: MISS` seguido de `HIT`.
6. Para probar rollback, enviar un checkout con ID `99999`: debe responder 400 y `SELECT count(*) FROM pedidos;` no debe aumentar.

`docker compose exec db psql -U multicatalogo -d multicatalogo` abre PostgreSQL. Los datos de ejemplo se cargan al crear el volumen por primera vez. La prueba automatizada es `npm run test:e2e` con Compose activo.

## Verificación realizada

- `go build ./...`, `go vet ./...` y `npm run build` completaron sin errores.
- `npm run test:e2e`: 9/9 pruebas pasaron.
- Catálogo: 8 productos; cabecera `MISS` seguida de `HIT`.
- Red: 7 referidos (3 directos), saldo inicial del administrador de 319,50; cabecera `MISS` seguida de `HIT`.
- Compra inválida: HTTP 400, pedidos `0 → 0` (rollback).
- Compra válida de dos sérums: HTTP 201, total 90, stock `50 → 48`, trabajo `done`, saldo del administrador `319,50 → 328,50` y siguiente lectura de red `MISS`.
- Compra de Diana (nivel 3) por 28: HTTP 201; PostgreSQL registró 2,80 para Carlos (nivel 1), 1,40 para Ana (nivel 2) y 0,56 para el administrador (nivel 3).

La base local de demostración se restableció después de verificar estas operaciones.
