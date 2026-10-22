import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProductos } from '../services/productosService';
import type { Producto } from '../data/productos';

export default function Catalogo({ storefront = false }: { storefront?: boolean }) {
  const { addToCart } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('relevancia');
  const [searchParams, setSearchParams] = useSearchParams();
  const categoria = searchParams.get('categoria') ?? 'Todas';
  const busqueda = searchParams.get('buscar') ?? '';

  useEffect(() => {
    let active = true;
    getProductos().then(data => { if (active) { setProductos(data); setLoading(false); } })
      .catch((cause: unknown) => { if (active) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo'); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const categoriasDisponibles = useMemo(() => Array.from(new Set(productos.map(item => item.categoria))), [productos]);
  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    const lista = productos.filter(item => (categoria === 'Todas' || item.categoria === categoria) &&
      (!texto || `${item.nombre} ${item.descripcion}`.toLocaleLowerCase('es').includes(texto)));
    if (sort === 'precio-asc') return lista.sort((a, b) => a.precio - b.precio);
    if (sort === 'precio-desc') return lista.sort((a, b) => b.precio - a.precio);
    if (sort === 'nombre') return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return lista;
  }, [productos, categoria, busqueda, sort]);

  function cambiarParametro(clave: 'categoria' | 'buscar', valor: string) {
    const siguiente = new URLSearchParams(searchParams);
    if (!valor || valor === 'Todas') siguiente.delete(clave); else siguiente.set(clave, valor);
    setSearchParams(siguiente, { replace: clave === 'buscar' });
  }

  return <div className="mc-store-page">
    <div className="mc-store-content">
      <section className="mc-soft-banner mc-store-hero">
        <div><span className="mc-kicker">Cosmética · bienestar · comunidad</span><h1 className="mc-serif">{storefront ? 'Cuidado consciente y belleza natural' : 'Catálogo de Productos'}</h1><p>{storefront ? 'Descubre productos para tu rutina y comparte tus favoritos con tu red. Belleza que se comparte, oportunidades que crecen.' : 'Explora la colección y encuentra lo que mejor se adapta a tu rutina.'}</p></div>
        <div className="mc-hero-trust"><span><b aria-hidden="true">✧</b><strong>Compra sencilla</strong><small>Desde cualquier lugar</small></span><span><b aria-hidden="true">◇</b><strong>Comparte tu red</strong><small>Consulta tus comisiones</small></span></div>
      </section>

      {loading ? <p role="status" className="mc-card mc-message">Cargando catálogo...</p> : error ? <p role="alert" className="mc-card mc-message text-red-700">{error}</p> : <>
        <section className="mc-catalog-toolbar" aria-label="Filtros de productos">
          <div className="mc-catalog-toolbar-top"><div className="mc-search-field"><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar productos" placeholder="Buscar sérums, cremas, kits..." value={busqueda} onChange={e => cambiarParametro('buscar', e.target.value)} /></div><div className="mc-catalog-sort"><span>{productosFiltrados.length} producto(s) encontrado(s)</span><label>Ordenar por: <select aria-label="Ordenar productos" value={sort} onChange={e => setSort(e.target.value)}><option value="relevancia">Relevancia</option><option value="precio-asc">Menor precio</option><option value="precio-desc">Mayor precio</option><option value="nombre">Nombre A-Z</option></select></label></div></div>
          <div className="mc-category-pills" role="group" aria-label="Filtrar por categoría"><button type="button" onClick={() => cambiarParametro('categoria', 'Todas')} className={categoria === 'Todas' ? 'is-active' : ''}>Todas</button>{categoriasDisponibles.map(cat => <button type="button" key={cat} onClick={() => cambiarParametro('categoria', cat)} className={categoria === cat ? 'is-active' : ''}>{cat}</button>)}</div>
          <select className="mc-category-select mc-field" aria-label="Categoría" value={categoria} onChange={e => cambiarParametro('categoria', e.target.value)}><option value="Todas">Todas las categorías</option>{categoriasDisponibles.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
        </section>

        {productosFiltrados.length ? <section className="mc-product-grid" aria-label="Productos">{productosFiltrados.map(prod => <article className="mc-product-card" key={prod.id}>
          <Link to={`/producto/${prod.id}`} className="mc-product-media"><img src={prod.img} alt={prod.nombre} loading="lazy" /></Link>
          <div className="mc-product-copy"><span className="mc-product-category">{prod.categoria}</span><Link to={`/producto/${prod.id}`}><h2>{prod.nombre}</h2></Link><p>{prod.descripcion}</p><div className="mc-product-bottom"><span><small>Precio público</small><strong>${prod.precio.toFixed(2)}</strong></span><button type="button" aria-label={`Añadir ${prod.nombre} al carrito`} onClick={() => addToCart(prod)}>＋ Añadir</button></div></div>
        </article>)}</section> : <div className="mc-card mc-catalog-empty"><p>No hay productos que coincidan con tu búsqueda.</p><button type="button" className="mc-btn mc-btn-soft" onClick={() => setSearchParams({})}>Limpiar filtros</button></div>}
      </>}

      <section className="mc-soft-banner mc-referral-banner"><div><span className="mc-kicker">Tu red de referidos</span><h2 className="mc-serif">Comparte lo que te gusta y haz crecer tu red</h2><p>Consulta tus referidos, revisa las comisiones registradas y copia tu enlace personal para invitar a alguien.</p></div><Link to="/mi-red" className="mc-btn mc-btn-primary">Ver Mi Red y Enlace →</Link></section>
    </div>
  </div>;
}
