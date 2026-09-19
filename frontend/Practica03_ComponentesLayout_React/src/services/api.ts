import type { Producto } from "../context/CartContext";

// La URL sale de la variable de entorno; si no existe se usa el backend local.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface LoginResponse {
  token: string;
  email: string;
}

// El backend responde { "error": "..." } cuando algo sale mal.
interface ErrorResponse {
  error?: string;
}

// POST /api/login -> valida las credenciales contra la API de Go
export const loginRequest = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as ErrorResponse).error || "No se pudo iniciar sesión");
  }

  return data as LoginResponse;
};

// GET /api/productos -> trae el catálogo desde la API de Go
export const getProductos = async (): Promise<Producto[]> => {
  const res = await fetch(`${API_URL}/api/productos`);

  if (!res.ok) {
    throw new Error("No se pudo cargar el catálogo");
  }

  return (await res.json()) as Producto[];
};
