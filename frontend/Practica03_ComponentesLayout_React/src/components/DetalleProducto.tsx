import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductoById, getProductos } from '../services/productosService';
import type { Producto } from '../data/productos';
import { useCart } from '../context/CartContext';

export default function DetalleProducto() {
  const { id } = useParams();
  return <Detalle key={id} id={Number(id)} />;
}

function Detalle({ id }: { id: number }) {
  const { addToCart } = useCart();
  const [producto, setProducto] = useState<Producto>();
  const [relacionados, setRelacionados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagenActiva, setImagenActiva] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let activo = true;
    getProductoById(id)
      .then(data => { if (activo && data) { setProducto(data); getProductos().then(lista => { if (activo) setRelacionados(lista.filter(item => item.id !== id && item.categoria === data.categoria).slice(0, 3)); }).catch(() => {}); } })
      .catch(() => { if (activo) setError('No se pudo cargar el producto. Intenta nuevamente.'); })
      .finally(() => { if (activo) setLoading(false); });
    return () => { activo = false; };
  }, [id]);

  if (loading) return <p role="status" className="mc-product-detail mc-message">Cargando producto...</p>;
  if (!producto) return <div className="mc-product-detail"><div className="mc-card mc-catalog-empty"><h1>{error || 'Producto no encontrado.'}</h1><Link to="/catalogo" className="mc-btn mc-btn-soft">Volver al catálogo</Link></div></div>;

  const imagenes = [producto.img, ...producto.galeria];
  const anterior = () => setImagenActiva(i => (i + imagenes.length - 1) % imagenes.length);
  const siguiente = () => setImagenActiva(i => (i + 1) % imagenes.length);
  function anadir() { for (let i = 0; i < cantidad; i++) addToCart(producto!); setAgregado(true); }

  return <div className="mc-product-detail">
    <nav aria-label="Ruta de navegación" className="mc-breadcrumb"><Link to="/tienda">Tienda</Link><span>›</span><Link to={`/catalogo?categoria=${encodeURIComponent(producto.categoria)}`}>{producto.categoria}</Link><span>›</span><strong>{producto.nombre}</strong></nav>
    <div className="mc-detail-grid">
      <div className="mc-detail-gallery"><button type="button" className="mc-detail-main-image" aria-label="Ampliar imagen del producto" onClick={() => dialog.current?.showModal()}><img src={imagenes[imagenActiva]} alt={producto.nombre} /></button><div className="mc-detail-thumbs">{imagenes.map((img, i) => <button type="button" key={`${img}-${i}`} aria-label={`Ver imagen ${i + 1}`} aria-pressed={imagenActiva === i} onClick={() => setImagenActiva(i)} className={imagenActiva === i ? 'is-active' : ''}><img src={img} alt={`Vista ${i + 1}`} /></button>)}</div></div>
      <div className="mc-detail-info"><span className="mc-kicker">{producto.categoria}</span><h1 className="mc-serif">{producto.nombre}</h1><div className="mc-detail-price"><strong>${producto.precio.toFixed(2)} USD</strong><small>Precio por unidad</small></div><p className="mc-detail-description">{producto.descripcion}</p><div className="mc-detail-buy"><div className="mc-quantity" role="group" aria-label="Cantidad"><button type="button" aria-label="Disminuir cantidad a comprar" disabled={cantidad === 1} onClick={() => setCantidad(v => Math.max(1, v - 1))}>−</button><span>{cantidad}</span><button type="button" aria-label="Aumentar cantidad a comprar" disabled={cantidad === 20} onClick={() => setCantidad(v => Math.min(20, v + 1))}>+</button></div><button type="button" aria-label="Añadir al Carrito" onClick={anadir} className="mc-btn mc-btn-primary">Añadir al Carrito · ${(producto.precio * cantidad).toFixed(2)}</button></div><p role="status" className="mc-detail-status">{agregado ? '✓ Producto añadido al carrito.' : ''}</p><Link to="/carrito" className="mc-detail-cart-link">Ver mi carrito →</Link><div className="mc-detail-note"><strong>Conoce tu red</strong><p>Comparte tu enlace personal y consulta las comisiones registradas de tus referidos.</p><Link to="/mi-red">Ir a Mi Red →</Link></div></div>
    </div>
    {relacionados.length > 0 && <section className="mc-related-products"><span className="mc-kicker">También podría interesarte</span><h2 className="mc-serif">Más de {producto.categoria}</h2><div>{relacionados.map(item => <Link to={`/producto/${item.id}`} key={item.id} className="mc-product-card"><img src={item.img} alt={item.nombre} loading="lazy" /><span><strong>{item.nombre}</strong><small>${item.precio.toFixed(2)}</small></span></Link>)}</div></section>}
    <dialog ref={dialog} aria-label={`Galería de ${producto.nombre}`} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white" onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} onKeyDown={e => { if (e.key === 'ArrowLeft') { e.preventDefault(); anterior(); } if (e.key === 'ArrowRight') { e.preventDefault(); siguiente(); } }}><button autoFocus aria-label="Cerrar galería" onClick={() => dialog.current?.close()} className="absolute top-4 right-4 rounded-lg bg-slate-800 px-4 py-2 text-3xl">×</button><div className="pointer-events-none flex h-full items-center justify-center gap-2 p-3 sm:gap-6"><button aria-label="Imagen anterior" onClick={anterior} className="pointer-events-auto rounded-lg bg-slate-800 p-3 text-3xl">‹</button><img src={imagenes[imagenActiva]} alt={`${producto.nombre}, vista ${imagenActiva + 1}`} className="pointer-events-auto max-h-[80dvh] min-w-0 max-w-[70vw] rounded-lg object-contain" /><button aria-label="Imagen siguiente" onClick={siguiente} className="pointer-events-auto rounded-lg bg-slate-800 p-3 text-3xl">›</button></div><p aria-live="polite" className="pointer-events-none absolute bottom-5 w-full text-center">{imagenActiva + 1} / {imagenes.length}</p></dialog>
  </div>;
}
