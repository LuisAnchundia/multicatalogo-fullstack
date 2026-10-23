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

En `/mi-red`, las ramas se despliegan por persona y se puede filtrar por nombre, nivel y ventas mínimas. Las comisiones registradas se muestran por mes (últimos seis meses) y se pueden descargar como CSV. El gráfico no inventa datos del saldo inicial de demostración. El árbol sigue llegando completo desde la API hasta tres niveles; la expansión ocurre en el navegador.

El diseño actual usa una barra lateral persistente en las pantallas internas de escritorio y un menú desplegable en móvil. Dashboard, tienda, catálogo, Mi Red y detalle de producto comparten la misma paleta y componentes visuales. Las imágenes locales sustituyen las fotos aleatorias de los ocho productos iniciales sin modificar las URLs que configure un administrador. El acceso muestra las cuentas de clase y permite ver u ocultar la contraseña.

El alcance detallado y el estado de verificación están en `ANALISIS_FUNCIONAL_U2.md` y `PLAN_IMPLEMENTACION_U2.md`.

**Prueba rápida:** entra como `cliente@upse.edu.ec`, añade un producto, confirma la compra y entra como `admin@upse.edu.ec` al Dashboard. El saldo de comisiones aumenta. No se realizan cobros reales. Para consultar PostgreSQL: `docker compose exec db psql -U multicatalogo -d multicatalogo`.

Los tokens van firmados con `TOKEN_SECRET`, y las contraseñas de demostración se guardan con bcrypt. El secreto y la contraseña por defecto de Compose son solo para ejecutar esta práctica en local.

## Cuentas de prueba

| Rol | Correo | Contraseña | Inicio |
|---|---|---|---|
| Admin | admin@upse.edu.ec | 123456 | Dashboard (`/`) |
| Cliente | cliente@upse.edu.ec | 123456 | Tienda (`/tienda`) |
| Cliente | luis.poveda@demo.local | 123456 | Tienda (`/tienda`) |

## Funciones y alcance

| Entregable | Implementación |
|---|---|
| F1 | `/tienda`: presentación, filtros por categoría y catálogo conectado a la API |
| F2 | `/producto/:id`: detalle y estado de producto inexistente |
| F3 | `/catalogo`: búsqueda por nombre/descripción y filtro en la URL |
| F4 | Galería de 4 imágenes, lightbox modal, foco, Escape y flechas |
| F5 | Carrito por cuenta, cantidades, checkout validado y confirmación |
| F6 | `/mi-red`: árbol recursivo, tres niveles y comisiones |
| F7 | `/`: resumen de ventas y comisiones desde reportes SQL |
| F8 | Login por API, cuentas de prueba seleccionables, contraseña visible y navegación por rol |

El Dashboard y el back-office son exclusivos del administrador. Ambos roles pueden consultar su propia red, sus pedidos y el flujo de compra.
El seed contiene 7 referidos y un saldo inicial demostrativo de $319,50 para el administrador.

## Publicación gratuita para la lección

`render.yaml` crea tres recursos en el plan Free de Render: un servicio web con React y Go en el mismo enlace HTTPS, PostgreSQL y Key Value (Redis). El `Dockerfile` de la raíz compila ambas partes. Al arrancar sobre una base vacía, Go carga `001_init.sql` con los datos de demostración; si las tablas ya existen, conserva los datos. `TOKEN_SECRET` se genera automáticamente en Render. No hace falta configurar `VITE_API_URL` ni CORS para el sitio público porque la interfaz y la API comparten origen.

Para desplegar: conecta este repositorio de GitHub en **Render → New → Blueprint**, selecciona la rama `main`, revisa que los tres recursos indiquen **Free** y aplica `render.yaml`. Cuando el servicio web termine, abre la URL `https://...onrender.com/login` y verifica el catálogo, el acceso y una compra de prueba. Las credenciales públicas de esta práctica son exclusivamente de demostración; no uses datos reales de personas o pagos.

Render suspende el backend gratuito tras 15 minutos sin tráfico y el primer acceso puede tardar alrededor de un minuto. Abre el enlace unos minutos antes de la exposición. Su PostgreSQL gratuito vence después de 30 días; haz la demostración antes de esa fecha.

La web incluye manifiesto PWA, iconos de 192 y 512 píxeles y service worker que guarda la interfaz, el JavaScript/CSS y las imágenes locales del catálogo. Después de abrir el catálogo con internet, guarda sus datos públicos por un máximo de **24 horas**. Si se corta la conexión, se puede consultar la última copia sin iniciar sesión desde **Ver el catálogo guardado** en la pantalla de acceso, o desde la tienda si la sesión sigue abierta. Muestra la fecha de la copia y oculta las acciones de compra; el login, los pedidos, la red, el back-office y el checkout requieren internet. Al volver la conexión, la copia se actualiza. Si vence o se borran los datos del navegador, hay que abrir el catálogo con internet otra vez.

El botón **Instalar app** abre la instalación cuando el navegador la ofrece. Si no hay un aviso disponible, aparece **¿Cómo instalar?** con indicaciones breves. Una PWA ya instalada no vuelve a mostrar el aviso en el mismo perfil del navegador; para repetir la prueba hay que desinstalarla desde `brave://apps`, `chrome://apps` o `edge://apps` y recargar la página. La instalación requiere abrir el enlace HTTPS público (o `localhost` para desarrollo). El diagnóstico y las fases PWA están en `REQUIREMENTS_CHECKLIST.md`.

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
npm run test:pwa
```

Las pruebas E2E levantan Vite si hace falta y requieren la API activa. Crean pedidos de prueba; los productos y usuarios temporales de las pruebas de back-office se desactivan al terminar. Conviene ejecutarlas contra una base separada. Se puede cambiar la API mediante `VITE_API_URL` para el navegador y `API_URL` para las peticiones directas de Playwright.
Usan contextos de navegador aislados, por lo que no modifican el carrito de tu navegador.
Son 15 pruebas que cubren API, roles, navegación, registro, administración, cálculos, compra, almacenamiento, árbol desplegable, filtros, exportación CSV, acceso con la cuenta de Luis, visibilidad de contraseña, accesibilidad
básica del lightbox y diseño móvil. Los reportes de fallo quedan en `test-results/`.
`npm run test:pwa` compila la web y ejecuta una prueba adicional con la versión de producción: guarda el catálogo, apaga la conexión, reabre la app y verifica el límite de 24 horas. Esta prueba simula las respuestas públicas de la API y no requiere levantar el backend.
El lint permite los tres avisos de Fast Refresh de los contextos, como indica la guía.
`tests/backoffice_smoke.py` prueba el back-office contra una API local en el puerto 3001 conectada a una base descartable.

Desde `backend/multicatalogo-backend`:

```powershell
go build ./...
go vet ./...
```

Consulta `VERIFICACION_TEMA5.md` para ver la correspondencia con los escenarios de entrega.
