import type { Producto } from '../data/productos';
import { apiRequest } from './api';

// Las imágenes de demostración de la base inicial son fotos aleatorias.
// Sustituimos solo esas portadas por los recursos del diseño de Stitch;
// cualquier imagen que configure el administrador conserva su URL.
const imagenesIniciales: Record<string, string> = {
  'Serum Revitalizante': '/productos/serum-revitalizante.webp',
  'Crema Hidratante Pro': '/productos/crema-hidratante.webp',
  'Tónico Purificante': '/productos/tonico-purificante.webp',
  'Mascarilla Nocturna': '/productos/mascarilla-nocturna.webp',
  'Serum Anti-Edad Retinol': '/productos/serum-retinol.webp',
  'Crema Contorno de Ojos': '/productos/contorno-ojos.webp',
  'Tónico Exfoliante AHA-BHA': '/productos/tonico-exfoliante.webp',
  'Kit Rutina Completa': '/productos/kit-rutina.webp',
};

function conImagenDelDiseno(producto: Producto): Producto {
  if (!producto.img.startsWith('https://picsum.photos/seed/')) return producto;
  const img = imagenesIniciales[producto.nombre];
  if (!img) return producto;
  const galeria = producto.nombre === 'Serum Revitalizante' ? [
    '/productos/serum-galeria-1.webp',
    '/productos/serum-galeria-2.webp',
    '/productos/serum-galeria-3.webp',
  ] : producto.galeria;
  return { ...producto, img, galeria };
}

// El catálogo y el detalle vienen de PostgreSQL a través de la API Go.
export const getProductos = async () => (await apiRequest<Producto[]>('/api/productos')).map(conImagenDelDiseno);

export const getProductoById = async (id: number): Promise<Producto | undefined> => {
  try {
    return conImagenDelDiseno(await apiRequest<Producto>(`/api/productos/${id}`));
  } catch (error) {
    if (error instanceof Error && error.message === 'Producto no encontrado') return undefined;
    throw error;
  }
};
