import type { Rol } from "../context/AuthContext";

// La URL sale de la variable de entorno; si no existe se usa el backend local.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface LoginResponse {
  token: string;
  email: string;
  rol: Rol;
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

  if (typeof data.email !== 'string' || !data.email ||
      typeof data.token !== 'string' || !data.token ||
      !['admin', 'cliente'].includes(data.rol)) {
    throw new Error('Respuesta de login inválida. Revisa que el backend esté actualizado al Tema 5.');
  }
  return data as LoginResponse;
};
