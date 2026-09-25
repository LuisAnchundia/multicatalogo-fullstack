import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductoById } from '../services/productosService';
import type { Producto } from '../data/productos';
import { useCart } from '../context/CartContext';

// La key reinicia la galería y el estado de carga cuando cambia :id.
export default function DetalleProducto() {
  const { id } = useParams();
  return <Detalle key={id} id={Number(id)} />;
}

function Detalle({ id }: { id: number }) {
  const { addToCart } = useCart();
  const [producto, setProducto] = useState<Producto>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagenActiva, setImagenActiva] = useState(0);
  const [agregado, setAgregado] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let activo = true;
    getProductoById(id)
      .then(data => { if (activo) setProducto(data); })
      .catch(() => { if (activo) setError('No se pudo cargar el producto. Intenta nuevamente.'); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [id]);

  if (loading) return <p role="status" className="p-8 text-center">Cargando producto...</p>;
  if (!producto) return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
      <h1 className="text-xl font-bold">{error || 'Producto no encontrado.'}</h1>
      <Link to="/catalogo" className="mt-4 inline-block text-indigo-600">Volver al catálogo</Link>
    </div>
  );

  const imagenes = [producto.img, ...producto.galeria];
  const anterior = () => setImagenActiva(i => (i + imagenes.length - 1) % imagenes.length);
  const siguiente = () => setImagenActiva(i => (i + 1) % imagenes.length);

  return (
    <div>
      <Link to="/catalogo" className="mb-6 inline-block font-semibold text-indigo-600">← Volver al catálogo</Link>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <button className="block w-full cursor-zoom-in rounded-xl" aria-label="Ampliar imagen del producto" onClick={() => dialog.current?.showModal()}>
            <img src={imagenes[imagenActiva]} alt={producto.nombre} className="h-80 w-full rounded-xl object-cover md:h-96" />
          </button>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {imagenes.map((img, i) => (
              <button key={img} aria-label={`Ver imagen ${i + 1}`} aria-pressed={imagenActiva === i} onClick={() => setImagenActiva(i)} className={`overflow-hidden rounded-lg border-2 ${imagenActiva === i ? 'border-indigo-600' : 'border-transparent opacity-70'}`}>
                <img src={img} alt={`Vista ${i + 1}`} className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-600">{producto.categoria}</p>
          <h1 className="mt-1 mb-3 text-3xl font-bold text-slate-800">{producto.nombre}</h1>
          <p className="mb-6 text-3xl font-bold text-indigo-600">${producto.precio.toFixed(2)}</p>
          <p className="mb-8 leading-relaxed text-slate-600">{producto.descripcion}</p>
          <button onClick={() => { addToCart(producto); setAgregado(true); }} className="w-full rounded-lg bg-indigo-600 px-8 py-4 font-bold text-white hover:bg-indigo-700 md:w-auto">Añadir al Carrito</button>
          <p role="status" className="mt-3 text-green-700">{agregado ? '✓ Añadido al carrito' : ''}</p>
        </div>
      </div>
      {/* showModal aporta bloqueo del fondo, foco contenido y cierre con Escape. */}
      <dialog ref={dialog} aria-label={`Galería de ${producto.nombre}`} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white"
        onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft') { e.preventDefault(); anterior(); }
          if (e.key === 'ArrowRight') { e.preventDefault(); siguiente(); }
        }}>
        <button autoFocus aria-label="Cerrar galería" onClick={() => dialog.current?.close()} className="absolute top-4 right-4 rounded-lg bg-slate-800 px-4 py-2 text-3xl">×</button>
        <div className="pointer-events-none flex h-full items-center justify-center gap-2 p-3 sm:gap-6">
          <button aria-label="Imagen anterior" onClick={anterior} className="pointer-events-auto rounded-lg bg-slate-800 p-3 text-3xl">‹</button>
          <img src={imagenes[imagenActiva]} alt={`${producto.nombre}, vista ${imagenActiva + 1}`} className="pointer-events-auto max-h-[80dvh] min-w-0 max-w-[70vw] rounded-lg object-contain" />
          <button aria-label="Imagen siguiente" onClick={siguiente} className="pointer-events-auto rounded-lg bg-slate-800 p-3 text-3xl">›</button>
        </div>
        <p aria-live="polite" className="pointer-events-none absolute bottom-5 w-full text-center">{imagenActiva + 1} / {imagenes.length}</p>
      </dialog>
    </div>
  );
}
