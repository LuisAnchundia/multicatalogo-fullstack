import type { Producto } from '../data/productos';
import { apiRequest } from './api';

// El catálogo y el detalle vienen de PostgreSQL a través de la API Go.
export const getProductos = () => apiRequest<Producto[]>('/api/productos');

export const getProductoById = async (id: number): Promise<Producto | undefined> => {
  try {
    return await apiRequest<Producto>(`/api/productos/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message === 'Producto no encontrado') return undefined;
    throw error;
  }
};
