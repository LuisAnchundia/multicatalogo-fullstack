# MultiCatálogo — Frontend

React 19 + TypeScript + Vite + Tailwind CSS + React Router.

```powershell
npm ci
npm run dev -- --port 5173 --strictPort
```

Antes de iniciarlo, levanta PostgreSQL, Redis y el backend desde la raíz con `docker compose up -d --build`.
Abre <http://localhost:5173>. `VITE_API_URL` permite cambiar la URL de la API; el catálogo, la red y el checkout usan ahora PostgreSQL a través de Go.

```powershell
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

- `src/components`: layout, navegación y vistas.
- `src/context`: sesión, carrito por usuario y menú lateral.
- `src/data`: tipos, categorías y datos de referencia para restaurar carritos anteriores.
- `src/services`: login, catálogo, red y checkout contra la API; lectura segura del carrito.
- `tests/flujos.spec.ts`: diez pruebas de navegador con Playwright; las 13 pruebas E2E incluyen también back-office y mejoras de red.

Las instrucciones, cuentas de prueba y límites de la simulación están en el [README principal](../../README.md).
