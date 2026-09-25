# MultiCatálogo — Frontend

React 19 + TypeScript + Vite + Tailwind CSS + React Router.

```powershell
npm ci
npm run dev -- --port 5173 --strictPort
```

Abre <http://localhost:5173>. Para iniciar sesión debe estar corriendo el backend Go en el puerto 3000.
`VITE_API_URL` permite cambiar su URL. El catálogo del Tema 5 usa mocks del frontend.

```powershell
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

- `src/components`: layout, navegación y vistas.
- `src/context`: sesión, carrito por usuario y menú lateral.
- `src/data`: productos, árbol de referidos, cálculos y tipo de pedido.
- `src/services`: login real contra la API, servicio mock de productos y lectura segura del carrito.
- `tests/flujos.spec.ts`: nueve pruebas de navegador con Playwright.

Las instrucciones, cuentas de prueba y límites de la simulación están en el [README principal](../../README.md).
