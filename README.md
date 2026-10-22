# MultiCatálogo — Tema 5, Fases 3–4 y avance U2

Proyecto académico con React, TypeScript, Go/Fiber, PostgreSQL y Redis. El frontend del Tema 5 se amplió para cumplir los notebooks `Fase 3.ipynb` y `Fase 4.ipynb` de la carpeta de la materia.

## Ejecutar

Requisitos: Docker Desktop iniciado, Node.js y npm. Desde la raíz de este repositorio:

```powershell
docker compose up -d --build
```

```powershell
cd frontend/Practica03_ComponentesLayout_React
npm ci
npm run dev -- --port 5173 --strictPort
```

Abre <http://localhost:5173>. La API escucha en el puerto 3000.
PostgreSQL se expone en `localhost:5433` porque el puerto 5432 ya está ocupado en este equipo; Redis usa `localhost:6379`. Dentro de Compose, el backend conecta con `db:5432` y `redis:6379`.
El SQL de `backend/multicatalogo-backend/db/001_init.sql` se ejecuta al crear el volumen por primera vez. El backend aplica `db/002_backoffice.sql` al iniciar, también sobre volúmenes existentes; no hace falta borrar los datos. Las credenciales de clase están en el seed y la configuración de ejemplo en `.env.example`.
Las carpetas `Unidad1_Frontend/Proyecto_base` y `Unidad2_Backend/multicatalogo-backend`
que cita la guía corresponden aquí a las carpetas `frontend/...` y `backend/...` anteriores.

La URL del login se configura con `VITE_API_URL` en el `.env` del frontend;
por defecto es `http://localhost:3000`. Existe `.env.example`.
Para usar otra IP, define `APP_ORIGINS` en un `.env` de la raíz y `VITE_API_URL` en el `.env` del frontend.

## Fase 3 — Caché con Redis

`GET /api/productos` consulta la clave `productos:all`; al faltar, lee los ocho productos de PostgreSQL y los guarda **5 minutos**. `GET /api/red` requiere un token y cachea el árbol de cada usuario en `red:tree:{email}` durante **10 minutos**. Las respuestas llevan `X-Cache: MISS` o `X-Cache: HIT` para ver el comportamiento en la pestaña Network.

## Fase 4 — Compra transaccional

`POST /api/checkout` recibe `cliente`, `metodoPago` e `items` (`id`, `cantidad`) con `Authorization: Bearer <token>`. El servidor calcula los precios desde PostgreSQL, bloquea el stock e inserta pedido, ítems y libro de comisiones en una transacción. Si un producto no existe o falta stock, hace rollback y devuelve HTTP 400. Si todo sale bien, confirma el pedido con HTTP 201 y vacía el carrito en React. Una goroutine acredita los saldos; los trabajos pendientes se reintentan al iniciar y cada 15 segundos.

## Avance U2 — Operación diaria

`/registro` crea clientes con un código opcional de referido. Cada usuario puede ver su red y copiar su enlace en `/mi-red`, consultar `/mis-pedidos` y revisar sus comisiones. El administrador dispone de `/admin/productos`, `/admin/usuarios`, `/admin/pedidos` y `/admin/liquidaciones`. El Dashboard consume reportes SQL. La cancelación de un pedido pendiente devuelve stock y revierte comisiones; una liquidación solo registra el pago administrativamente.

El alcance detallado y el estado de verificación están en `ANALISIS_FUNCIONAL_U2.md` y `PLAN_IMPLEMENTACION_U2.md`.

**Prueba rápida:** entra como `cliente@upse.edu.ec`, añade un producto, confirma la compra y entra como `admin@upse.edu.ec` al Dashboard. El saldo de comisiones aumenta. No se realizan cobros reales. Para consultar PostgreSQL: `docker compose exec db psql -U multicatalogo -d multicatalogo`.

Los tokens van firmados con `TOKEN_SECRET`, y las contraseñas de demostración se guardan con bcrypt. El secreto y la contraseña por defecto de Compose son solo para ejecutar esta práctica en local.

## Cuentas de prueba

| Rol | Correo | Contraseña | Inicio |
|---|---|---|---|
| Admin | admin@upse.edu.ec | 123456 | Dashboard (`/`) |
| Cliente | cliente@upse.edu.ec | 123456 | Tienda (`/tienda`) |

## Funciones y alcance

| Entregable | Implementación |
|---|---|
| F1 | `/tienda`: hero de pantalla completa, 5 categorías y 4 destacados |
| F2 | `/producto/:id`: detalle y estado de producto inexistente |
| F3 | `/catalogo`: búsqueda por nombre/descripción y filtro en la URL |
| F4 | Galería de 4 imágenes, lightbox modal, foco, Escape y flechas |
| F5 | Carrito por cuenta, cantidades, checkout validado y confirmación |
| F6 | `/mi-red`: árbol recursivo, tres niveles y comisiones |
| F7 | `/`: resumen de ventas y comisiones desde reportes SQL |
| F8 | Login por API, rutas y navegación por rol |

El Dashboard y el back-office son exclusivos del administrador. Ambos roles pueden consultar su propia red, sus pedidos y el flujo de compra.
El seed contiene 7 referidos y un saldo inicial demostrativo de $319,50 para el administrador.

En la entrega original del Tema 5 (antes de estas fases):

- El frontend consumía productos y red simulados, y el checkout no guardaba pedidos. Las Fases 3 y 4 sustituyen esas partes por API, PostgreSQL y Redis.
- Sigue siendo una simulación de pago: registra la compra académica, pero no cobra dinero.

## Persistencia y ajustes al ejemplo de la guía

El carrito se guarda en `localStorage` con la clave `multicatalogo_carrito_<email>`.
`CartBoundary` remonta el contexto al cambiar de cuenta, evitando mezclar carritos.
Los datos guardados se validan y los productos se reconstruyen desde el catálogo.

La sesión se conserva en `sessionStorage` para permitir recargas; cerrar sesión la elimina. Las rutas de compra y red validan el token firmado en el backend.
La confirmación viaja por `location.state`, muestra solo pedidos de la cuenta actual y
no inventa una compra al entrar directamente. El pedido queda en PostgreSQL y se consulta desde `/mis-pedidos`.

También se corrige la sincronización de categorías al usar Atrás/Adelante, el uso del
lightbox con teclado, las etiquetas del formulario, los espacios en campos obligatorios,
el cierre de sesión táctil y la cancelación del temporizador al abandonar el checkout.

## Verificar

Primero levanta Compose. Desde `frontend/Practica03_ComponentesLayout_React`:

```powershell
npm run lint
npm run build
npm run test:e2e
```

Las pruebas E2E levantan Vite si hace falta y requieren la API activa. Crean pedidos, productos y usuarios de prueba: conviene ejecutarlas contra una base separada. Se puede cambiar la API mediante `VITE_API_URL` para el navegador y `API_URL` para las peticiones directas de Playwright.
Usan contextos de navegador aislados, por lo que no modifican el carrito de tu navegador.
Son 11 pruebas que cubren API, roles, navegación, registro, administración, cálculos, compra, almacenamiento, accesibilidad
básica del lightbox y diseño móvil. Los reportes de fallo quedan en `test-results/`.
El lint permite los tres avisos de Fast Refresh de los contextos, como indica la guía.
`tests/backoffice_smoke.py` prueba el back-office contra una API local en el puerto 3001 conectada a una base descartable.

Desde `backend/multicatalogo-backend`:

```powershell
go build ./...
go vet ./...
```

Consulta `VERIFICACION_TEMA5.md` para ver la correspondencia con los escenarios de entrega.
