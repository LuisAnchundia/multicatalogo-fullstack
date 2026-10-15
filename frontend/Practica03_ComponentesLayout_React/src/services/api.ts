import type { Rol } from "../context/AuthContext";
import type { Referido } from '../data/red';
import type { PedidoConfirmado } from '../data/pedidos';

// La URL sale de la variable de entorno; si no existe se usa el backend local.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface LoginResponse {
  token: string;
  email: string;
  rol: Rol;
}

// El backend responde { "error": "..." } cuando algo sale mal.
interface ErrorResponse {
  error?: string;
  message?: string;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error('No se pudo conectar con el backend. Comprueba que Docker esté iniciado.');
  }
  const data = await res.json() as T & ErrorResponse;
  if (!res.ok) throw new Error(data.error || data.message || 'Error del servidor');
  return data;
}

export const getRed = (token: string) =>
  apiRequest<Referido>('/api/red', { headers: { Authorization: `Bearer ${token}` } });

export interface CheckoutPayload {
  cliente: { nombre: string; email: string; direccion: string; ciudad: string; telefono: string };
  metodoPago: string;
  items: { id: number; cantidad: number }[];
}

export const checkoutRequest = (token: string, payload: CheckoutPayload) =>
  apiRequest<PedidoConfirmado>('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

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
    throw new Error((data as ErrorResponse).error || (data as ErrorResponse).message || "No se pudo iniciar sesión");
  }

  if (typeof data.email !== 'string' || !data.email ||
      typeof data.token !== 'string' || !data.token ||
      !['admin', 'cliente'].includes(data.rol)) {
    throw new Error('Respuesta de login inválida. Revisa que el backend esté actualizado al Tema 5.');
  }
  return data as LoginResponse;
};
