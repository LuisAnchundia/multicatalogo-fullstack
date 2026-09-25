# MultiCatálogo — Práctica 03, Tema 5

Proyecto académico con React 19, TypeScript, Vite, Tailwind CSS, React Router y API Go/Fiber.
Implementa los ocho entregables de `Guia_Practica_Tema5_leccion.md`.

## Ejecutar

Requisitos: Node.js y npm compatibles con el `package-lock.json`, y Go según `backend/multicatalogo-backend/go.mod`.
Desde la raíz del repositorio, abre dos terminales:

```powershell
cd backend/multicatalogo-backend
go run .
```

```powershell
cd frontend/Practica03_ComponentesLayout_React
npm ci
npm run dev -- --port 5173 --strictPort
```

Abre <http://localhost:5173>. La API escucha en el puerto 3000.
Las carpetas `Unidad1_Frontend/Proyecto_base` y `Unidad2_Backend/multicatalogo-backend`
que cita la guía corresponden aquí a las carpetas `frontend/...` y `backend/...` anteriores.

La URL del login se configura con `VITE_API_URL` en el `.env` del frontend;
por defecto es `http://localhost:3000`. Existe `.env.example`.
Para usar otra IP, ajusta también los orígenes CORS en `backend/multicatalogo-backend/main.go`.

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

Según el alcance del Tema 5:

- El login llama a `POST /api/login`; el backend devuelve correo, rol y un token ficticio.
- El frontend consume 8 productos mock mediante `services/productosService.ts`.
- `GET /api/productos` conserva los 4 productos básicos del backend del tema anterior.
- La red es un mock compartido en `data/red.ts`; los KPIs se calculan, no se escriben como cifras fijas en las vistas.
- El checkout simula 1,2 segundos de procesamiento. No cobra dinero ni registra pedidos en una base de datos.
- JWT real, PostgreSQL, pagos reales y gestión de referidos quedan fuera de esta práctica.

## Persistencia y ajustes al ejemplo de la guía

El carrito se guarda en `localStorage` con la clave `multicatalogo_carrito_<email>`.
`CartBoundary` remonta el contexto al cambiar de cuenta, evitando mezclar carritos.
Los datos guardados se validan y los productos se reconstruyen desde el catálogo.

La sesión se conserva en `sessionStorage` para permitir recargas; cerrar sesión la elimina.
Esta persistencia es para la demostración y no sustituye la autorización de un backend real.
La confirmación viaja por `location.state`, muestra solo pedidos de la cuenta actual y
no inventa una compra al entrar directamente. No hay historial permanente de pedidos.

También se corrige la sincronización de categorías al usar Atrás/Adelante, el uso del
lightbox con teclado, las etiquetas del formulario, los espacios en campos obligatorios,
el cierre de sesión táctil y la cancelación del temporizador al abandonar el checkout.

## Verificar

Desde `frontend/Practica03_ComponentesLayout_React`:

```powershell
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Las pruebas E2E levantan automáticamente ambos servidores cuando no están encendidos.
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
