# MultiCatálogo — Frontend

Interfaz del panel, hecha con React 19, TypeScript, Vite y Tailwind 4.
Consume la API en Go que está en `../../backend/multicatalogo-backend`.

## Correrlo

```bash
npm install
npm run dev
```

Queda en http://localhost:5173. El backend tiene que estar levantado en el
puerto 3000, si no el login y el catálogo no van a responder.

La URL de la API se lee de `VITE_API_URL`; si no se define, se usa
`http://localhost:3000`. El ejemplo está en `.env.example`.

## Scripts

| Comando           | Qué hace                                  |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Servidor de desarrollo con recarga en vivo |
| `npm run build`   | Revisa los tipos y compila a `dist/`       |
| `npm run preview` | Sirve lo que quedó en `dist/`              |
| `npm run lint`    | Pasa ESLint sobre el proyecto              |

## Organización

```
src/
├── components/   Layout, Navbar, Sidebar, vistas y los iconos SVG
├── context/      AuthContext, CartContext y SidebarContext
└── services/     api.ts, donde están todas las llamadas fetch
```

El estado del menú lateral está en `SidebarContext` y no dentro del Sidebar,
porque quien lo cambia es el botón Toggle que vive en el Navbar. El `Layout` lo
lee del contexto y se lo pasa al `Sidebar` por la prop `isCollapsed`.
