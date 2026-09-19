# MultiCatálogo

Panel de administración hecho con React + TypeScript en el frontend y una API REST
en Go (Fiber) en el backend. Es el proyecto base de la asignatura Framework de
Programación Web, con el sidebar colapsable y el consumo de la API ya integrados.

## Estructura

```
Practica03_Multicatalogo/
├── frontend/Practica03_ComponentesLayout_React/   React + Vite + Tailwind
└── backend/multicatalogo-backend/                 Go + Fiber
```

## Cómo levantarlo

Hacen falta las dos partes corriendo al mismo tiempo, en dos terminales.

**1. Backend** (queda en el puerto 3000)

```bash
cd backend/multicatalogo-backend
go run .
```

**2. Frontend** (queda en el puerto 5173)

```bash
cd frontend/Practica03_ComponentesLayout_React
npm install
npm run dev
```

Luego se abre http://localhost:5173.

La URL de la API se lee de `VITE_API_URL`. Si no se crea el archivo `.env`, el
frontend usa `http://localhost:3000` por defecto, así que normalmente no hay que
configurar nada. Si se necesita cambiar, está el ejemplo en `.env.example`.

## Credenciales de prueba

| Correo              | Contraseña |
| ------------------- | ---------- |
| admin@upse.edu.ec   | 123456     |

## Endpoints

| Método | Ruta             | Qué hace                                        |
| ------ | ---------------- | ----------------------------------------------- |
| POST   | `/api/login`     | Valida las credenciales y devuelve un token      |
| GET    | `/api/productos` | Devuelve el catálogo de productos                |

El CORS del backend permite `localhost:5173` y `127.0.0.1:5173`.

## Qué se implementó

**Sidebar colapsable**

- El componente `Sidebar` recibe la prop `isCollapsed`; cuando es `true` el ancho
  baja de 256px a 80px y solo quedan los iconos.
- El estado vive en `SidebarContext`, así el botón Toggle del `Navbar` puede
  modificarlo aunque el Sidebar sea otro componente.
- Cada opción del menú tiene su icono en SVG (`components/Icons.tsx`), sin
  librerías externas.
- En celular el menú funciona como cajón deslizable con fondo oscuro; el colapso
  a 80px solo aplica de 768px hacia arriba, donde sí tiene sentido.

**Conexión con la API**

- `services/api.ts` centraliza las llamadas con `fetch`.
- El login dejó de estar quemado: ahora valida contra `POST /api/login` y guarda
  el token en `AuthContext`.
- El catálogo se carga con `GET /api/productos` dentro de un `useEffect`, con sus
  estados de carga y de error.
