# Mapa del proyecto MultiCatálogo

- `frontend/Practica03_ComponentesLayout_React/`: SPA React y TypeScript. `src/App.tsx` define las rutas; `src/components/` contiene tienda, registro, red, pedidos y pantallas administrativas; `src/services/api.ts` concentra las peticiones.
- `backend/multicatalogo-backend/`: API Go/Fiber. `routes/routes.go` registra endpoints; `controllers/` valida acceso y peticiones; `repository/` ejecuta las operaciones SQL; `service/app.go` gestiona caché y checkout.
- `backend/multicatalogo-backend/db/001_init.sql`: esquema y datos de demostración para volumen nuevo.
- `backend/multicatalogo-backend/db/002_backoffice.sql`: migración incremental que el servidor aplica al iniciar.
- `docker-compose.yml`: PostgreSQL, Redis y backend.
- `FASES_3_4.md`: implementación de las fases anteriores.
- `ANALISIS_FUNCIONAL_U2.md` y `PLAN_IMPLEMENTACION_U2.md`: alcance y estado del avance actual.

La jerarquía de referidos se guarda en `usuarios.parent_id` y las comisiones en la tabla `comisiones`. No hay una tabla independiente llamada `referidos`.
