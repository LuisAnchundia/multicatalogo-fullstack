# MultiCatálogo — Tema 5 y Fases 3–4

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
El SQL de `backend/multicatalogo-backend/db/001_init.sql` se ejecuta al crear el volumen por primera vez. Las credenciales de clase están en ese archivo y la configuración de ejemplo en `.env.example`.
Las carpetas `Unidad1_Frontend/Proyecto_base` y `Unidad2_Backend/multicatalogo-backend`
que cita la guía corresponden aquí a las carpetas `frontend/...` y `backend/...` anteriores.

La URL del login se configura con `VITE_API_URL` en el `.env` del frontend;
por defecto es `http://localhost:3000`. Existe `.env.example`.
Para usar otra IP, define `APP_ORIGINS` en un `.env` de la raíz y `VITE_API_URL` en el `.env` del frontend.

## Fase 3 — Caché con Redis

`GET /api/productos` consulta la clave `productos:all`; al faltar, lee los ocho productos de PostgreSQL y los guarda **5 minutos**. `GET /api/red` requiere un token y cachea el árbol de cada usuario en `red:tree:{email}` durante **10 minutos**. Las respuestas llevan `X-Cache: MISS` o `X-Cache: HIT` para ver el comportamiento en la pestaña Network.

## Fase 4 — Compra transaccional

`POST /api/checkout` recibe `cliente`, `metodoPago` e `items` (`id`, `cantidad`) con `Authorization: Bearer <token>`. El servidor calcula los precios desde PostgreSQL, bloquea el stock, inserta pedido e items y registra el trabajo de comisiones dentro de una transacción. Si un producto no existe o falta stock, hace rollback y devuelve HTTP 400. Si todo sale bien, confirma el pedido con HTTP 201, vacía el carrito en React y procesa las comisiones de los tres niveles en una goroutine. Los trabajos pendientes se reintentan al iniciar y cada 15 segundos; las claves afectadas de Redis se invalidan tras la compra y tras las comisiones.

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
| F7 | `/`: KPIs derivados de las mismas funciones que usa Mi Red |
| F8 | Login por API, rutas y navegación por rol |

Dashboard y Mi Red son exclusivos del administrador. Ambos roles acceden al flujo de compra.
Los valores iniciales son 7 referidos, $4.090 en ventas, $319,50 en comisiones y nivel Plata.

En la entrega original del Tema 5 (antes de estas fases):

- El frontend consumía productos y red simulados, y el checkout no guardaba pedidos. Las Fases 3 y 4 sustituyen esas partes por API, PostgreSQL y Redis.
- Sigue siendo una simulación de pago: registra la compra académica, pero no cobra dinero.

## Persistencia y ajustes al ejemplo de la guía

El carrito se guarda en `localStorage` con la clave `multicatalogo_carrito_<email>`.
`CartBoundary` remonta el contexto al cambiar de cuenta, evitando mezclar carritos.
Los datos guardados se validan y los productos se reconstruyen desde el catálogo.

La sesión se conserva en `sessionStorage` para permitir recargas; cerrar sesión la elimina. Las rutas de compra y red validan el token firmado en el backend.
La confirmación viaja por `location.state`, muestra solo pedidos de la cuenta actual y
no inventa una compra al entrar directamente. Ahora el pedido sí queda en PostgreSQL; no se implementó todavía una pantalla de historial.

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

Las pruebas E2E levantan Vite si hace falta y requieren el backend de Compose activo.
Usan contextos de navegador aislados, por lo que no modifican el carrito de tu navegador.
Son 9 pruebas que cubren API, roles, navegación, cálculos, compra, almacenamiento, accesibilidad
básica del lightbox y diseño móvil. Los reportes de fallo quedan en `test-results/`.
El lint permite los tres avisos de Fast Refresh de los contextos, como indica la guía.

Desde `backend/multicatalogo-backend`:

```powershell
go build ./...
go vet ./...
```

Consulta `VERIFICACION_TEMA5.md` para ver la correspondencia con los escenarios de entrega.
