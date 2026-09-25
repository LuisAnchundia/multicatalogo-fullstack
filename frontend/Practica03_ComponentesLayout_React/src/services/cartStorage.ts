import { productosMock } from '../data/productos';
import type { CartItem } from '../context/CartContext';

// localStorage puede contener JSON antiguo o dañado. Reconstruimos los
// productos desde el catálogo para no confiar en precios y nombres guardados.
export function leerCarrito(storageKey: string): CartItem[] {
  try {
    const guardado: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(guardado)) return [];
    const vistos = new Set<number>();
    return guardado.flatMap(item => {
      if (!item || typeof item !== 'object' || !Number.isSafeInteger(item.cantidad) || item.cantidad <= 0 || vistos.has(item.id)) return [];
      const producto = productosMock.find(p => p.id === item.id);
      if (!producto) return [];
      vistos.add(producto.id);
      return [{ ...producto, cantidad: item.cantidad }];
    });
  } catch { return []; }
}
