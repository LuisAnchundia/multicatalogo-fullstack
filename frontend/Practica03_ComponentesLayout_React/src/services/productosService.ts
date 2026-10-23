import type { Producto } from '../data/productos';
import { apiRequest } from './api';

const CATALOG_CACHE_KEY = 'multicatalogo_catalogo_publico_v1';
export const CATALOG_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export interface CatalogoGuardado {
  productos: Producto[];
  guardadoEn: number;
}

function esProducto(value: unknown): value is Producto {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Producto>;
  return typeof item.id === 'number' && Number.isFinite(item.id) &&
    typeof item.nombre === 'string' && typeof item.descripcion === 'string' &&
    typeof item.precio === 'number' && Number.isFinite(item.precio) &&
    typeof item.categoria === 'string' && typeof item.img === 'string' &&
    Array.isArray(item.galeria) && item.galeria.every(img => typeof img === 'string');
}

export function getCatalogoGuardado(): CatalogoGuardado | null {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<CatalogoGuardado>;
    const age = Date.now() - (saved.guardadoEn ?? 0);
    if (!Number.isFinite(age) || age < 0 || age > CATALOG_CACHE_MAX_AGE ||
        !Array.isArray(saved.productos) || !saved.productos.every(esProducto)) {
      localStorage.removeItem(CATALOG_CACHE_KEY);
      return null;
    }
    return saved as CatalogoGuardado;
  } catch {
    return null;
  }
}

function guardarCatalogo(productos: Producto[]): void {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ productos, guardadoEn: Date.now() }));
  } catch { /* El catálogo en línea sigue funcionando si el almacenamiento está bloqueado. */ }
}

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
export const getProductos = async () => {
  const data = await apiRequest<Producto[]>('/api/productos');
  if (!Array.isArray(data) || !data.every(esProducto)) throw new Error('El catálogo recibido no es válido.');
  const productos = data.map(conImagenDelDiseno);
  guardarCatalogo(productos);
  return productos;
};

export async function getProductosConRespaldo(): Promise<{ productos: Producto[]; guardadoEn?: number }> {
  const guardado = getCatalogoGuardado();
  if (!navigator.onLine) {
    if (guardado) return guardado;
    throw new Error('Sin conexión. Abre el catálogo con internet para guardarlo en este dispositivo.');
  }
  try {
    return { productos: await getProductos() };
  } catch (error) {
    if (guardado) return guardado;
    throw error;
  }
}

export const getProductoById = async (id: number): Promise<Producto | undefined> => {
  try {
    return conImagenDelDiseno(await apiRequest<Producto>(`/api/productos/${id}`));
  } catch (error) {
    if (error instanceof Error && error.message === 'Producto no encontrado') return undefined;
    throw error;
  }
};
