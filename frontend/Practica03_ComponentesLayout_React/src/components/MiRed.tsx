import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { contarRed, filtrarRed, nivelAlcanzado, sumarVentasRed, type Referido } from '../data/red';
import { useRed } from '../hooks/useRed';
import { authorized, type Commission } from '../services/api';

const dinero = (cantidad: number) => '$' + cantidad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function NodoReferido({ nodo, mostrarRuta }: { nodo: Referido; mostrarRuta: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const tieneHijos = Boolean(nodo.hijos?.length);
  const visible = mostrarRuta || abierto;
  const idHijos = 'referidos-' + nodo.id;
  return <li className="mc-node-item">
    <div className="mc-node">
      <div className="mc-node-person">
        {tieneHijos ? <button type="button" aria-label={(visible ? 'Ocultar' : 'Mostrar') + ' referidos de ' + nodo.nombre} aria-expanded={visible} aria-controls={idHijos} disabled={mostrarRuta} onClick={() => setAbierto(actual => !actual)} className="mc-node-toggle">{visible ? '−' : '+'}</button> : <span className="mc-node-placeholder" aria-hidden="true">·</span>}
        <span className="mc-node-avatar" aria-hidden="true">{nodo.nombre.charAt(0)}</span>
        <span className="mc-node-info"><strong>{nodo.nombre}</strong><small>{tieneHijos ? `${nodo.hijos?.length} referido(s) directo(s)` : 'Sin referidos directos'}</small></span>
      </div>
      <span className="mc-level-pill">Nivel {nodo.nivel} · {[0, 10, 5, 2][nodo.nivel] ?? 0} % comisión</span>
      <span className="mc-node-sales"><small>Ventas registradas</small><strong>{dinero(nodo.ventas)}</strong></span>
    </div>
    {tieneHijos && visible && <ul id={idHijos} className="mc-node-children">{nodo.hijos?.map(hijo => <NodoReferido key={hijo.id} nodo={hijo} mostrarRuta={mostrarRuta} />)}</ul>}
  </li>;
}

function tendenciaMensual(comisiones: Commission[]) {
  const ahora = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - 5 + index, 1);
    const mes = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
    const total = comisiones.filter(item => item.estado !== 'revertida' && item.fecha.startsWith(mes)).reduce((suma, item) => suma + item.monto, 0);
    return { mes, etiqueta: fecha.toLocaleDateString('es-EC', { month: 'short' }), total };
  });
}

function descargarComisiones(comisiones: Commission[]) {
  const celda = (valor: string) => '"' + valor.replace(/"/g, '""') + '"';
  const filas = [['Pedido', 'Fecha', 'Nivel', 'Monto (USD)', 'Estado'], ...comisiones.map(item => [item.numero, item.fecha.slice(0, 10), String(item.nivel), item.monto.toFixed(2), item.estado])];
  const contenido = '\uFEFF' + filas.map(fila => fila.map(celda).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a'); enlace.href = url; enlace.download = 'mis-comisiones.csv'; enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MiRed() {
  const { red, loading, error } = useRed();
  const { token } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [comisiones, setComisiones] = useState<Commission[]>([]);
  const [errorComisiones, setErrorComisiones] = useState('');
  const [estadoCopia, setEstadoCopia] = useState('');
  const [nombre, setNombre] = useState('');
  const [nivelFiltro, setNivelFiltro] = useState('');
  const [ventasFiltro, setVentasFiltro] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    authorized<{ codigo: string }>(token, '/api/referido/codigo').then(ref => { if (active) setCodigo(ref.codigo); }).catch(() => { if (active) setEstadoCopia('No se pudo cargar el enlace de referido.'); });
    authorized<Commission[]>(token, '/api/comisiones/mias').then(datos => { if (active) setComisiones(datos); }).catch(() => { if (active) setErrorComisiones('No se pudieron cargar las comisiones.'); });
    return () => { active = false; };
  }, [token]);

  const hayFiltros = Boolean(nombre.trim() || nivelFiltro || ventasFiltro);
  const resultado = useMemo(() => red && hayFiltros ? filtrarRed(red, { nombre, nivel: nivelFiltro ? Number(nivelFiltro) : null, ventasMinimas: ventasFiltro ? Number(ventasFiltro) : null }) : null, [red, hayFiltros, nombre, nivelFiltro, ventasFiltro]);
  const meses = useMemo(() => tendenciaMensual(comisiones), [comisiones]);
  const maximo = Math.max(...meses.map(item => item.total), 0);

  async function copiar() {
    if (!codigo) return;
    try { await navigator.clipboard.writeText(window.location.origin + '/registro?ref=' + encodeURIComponent(codigo)); setEstadoCopia('Enlace copiado.'); }
    catch { setEstadoCopia('No se pudo copiar; selecciona el enlace manualmente.'); }
  }

  if (loading) return <div role="status" aria-label="Cargando red" className="mc-network-page"><div className="h-36 animate-pulse rounded-2xl bg-emerald-100" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map(item => <div key={item} className="h-32 animate-pulse rounded-xl bg-slate-200" />)}</div></div>;
  if (!red) return <p role="alert" className="mc-network-page text-red-700">{error || 'No se pudo cargar la red'}</p>;

  const saldo = red.saldo ?? 0;
  const nivel = nivelAlcanzado(red.hijos?.length ?? 0);
  const enlace = codigo ? window.location.origin + '/registro?ref=' + encodeURIComponent(codigo) : '';
  const hijosVisibles = resultado?.red.hijos ?? red.hijos ?? [];
  const resumen = [
    { etiqueta: 'Saldo de comisiones', valor: dinero(saldo), nota: 'Según comisiones registradas', icono: '◇' },
    { etiqueta: 'Referidos en la red', valor: String(contarRed(red)), nota: 'En tu estructura', icono: '♧' },
    { etiqueta: 'Ventas de la red', valor: dinero(sumarVentasRed(red)), nota: 'Volumen acumulado', icono: '↗' },
    { etiqueta: 'Nivel alcanzado', valor: nivel, nota: 'Según referidos directos', icono: '✦' },
  ];

  return <div className="mc-network-page">
    <header className="mc-soft-banner mc-network-hero"><div><span className="mc-kicker">Tu comunidad · Nivel {nivel}</span><h1 className="mc-serif">Mi Red de Referidos</h1><p>Explora tu estructura, comparte tu enlace y consulta las comisiones registradas en cada nivel.</p></div><div className="mc-network-level"><span>Tu nivel actual</span><strong>{nivel}</strong><small>{contarRed(red)} referidos en la red</small></div></header>
    <div className="mc-network-metrics">{resumen.map(item => <article className="mc-card mc-network-metric" key={item.etiqueta}><div><span>{item.etiqueta}</span><b aria-hidden="true">{item.icono}</b></div><strong>{item.valor}</strong><small>{item.nota}</small></article>)}</div>
    <div className="mc-network-grid">
      <section className="mc-card mc-invite-card"><span className="mc-kicker">Tu enlace de afiliación</span><h2>Expande tu red</h2><p>Invita a nuevas personas a registrarse con tu enlace. Podrás seguir su actividad desde aquí.</p><div className="mc-levels"><span><b>10 %</b><small>Nivel 1</small></span><span><b>5 %</b><small>Nivel 2</small></span><span><b>2 %</b><small>Nivel 3</small></span></div>{codigo && <><label htmlFor="enlace-referido">Enlace personalizado</label><div className="mc-invite-input"><input id="enlace-referido" aria-label="Enlace de referido" readOnly value={enlace} onFocus={evento => evento.currentTarget.select()} /><button type="button" onClick={() => void copiar()}>Copiar</button></div><small className="mc-invite-code">Código: {codigo}</small></>}{estadoCopia && <p role="status" className="mc-invite-status">{estadoCopia}</p>}</section>
      <section className="mc-card mc-commission-chart"><span className="mc-kicker">Historial reciente</span><h2>Comisiones por mes</h2><p>Últimos seis meses, según los pedidos registrados.</p>{maximo > 0 ? <ul aria-label="Comisiones de los últimos seis meses" className="mc-chart-bars">{meses.map(item => <li key={item.mes} aria-label={item.mes + ': ' + dinero(item.total)}><span>{item.total ? dinero(item.total) : '—'}</span><div style={{ height: Math.max(item.total ? 7 : 2, item.total / maximo * 155) + 'px' }} aria-hidden="true" /><small>{item.etiqueta}</small></li>)}</ul> : <p className="mc-chart-empty">Aún no hay comisiones registradas en los últimos seis meses.</p>}</section>
    </div>
    <section className="mc-card mc-tree-card"><div className="mc-tree-heading"><div><span className="mc-kicker">Estructura de tu comunidad</span><h2>Jerarquía de tu Red</h2><p>Abre cada persona para ver sus referidos.</p></div>{hayFiltros && <button type="button" className="mc-btn mc-btn-soft" onClick={() => { setNombre(''); setNivelFiltro(''); setVentasFiltro(''); }}>Limpiar filtros</button>}</div><div className="mc-tree-filters"><label>Buscar por nombre<input type="search" className="mc-field" placeholder="Nombre del referido" value={nombre} onChange={evento => setNombre(evento.target.value)} /></label><label>Nivel<select className="mc-field" value={nivelFiltro} onChange={evento => setNivelFiltro(evento.target.value)}><option value="">Todos los niveles</option><option value="1">Nivel 1</option><option value="2">Nivel 2</option><option value="3">Nivel 3</option></select></label><label>Ventas mínimas (USD)<input type="number" min="0" step="0.01" className="mc-field" placeholder="0.00" value={ventasFiltro} onChange={evento => setVentasFiltro(evento.target.value)} /></label></div><div className="mc-tree-root"><span className="mc-node-avatar">{red.nombre.charAt(0)}</span><span><strong>{red.nombre}</strong><small>Tu red · Nivel {nivel}</small></span><b>Saldo: {dinero(saldo)}</b></div>{hayFiltros && <p role="status" className="mc-filter-count">{resultado?.coincidencias ?? 0} {(resultado?.coincidencias ?? 0) === 1 ? 'coincidencia' : 'coincidencias'}</p>}{hijosVisibles.length ? <ul className="mc-node-list">{hijosVisibles.map(hijo => <NodoReferido key={hijo.id} nodo={hijo} mostrarRuta={hayFiltros} />)}</ul> : <p className="mc-tree-empty">{hayFiltros ? 'No hay referidos que coincidan con los filtros.' : 'Aún no tienes referidos. Comparte tu enlace para empezar.'}</p>}</section>
    <section className="mc-card mc-commissions-list"><div className="mc-tree-heading"><div><span className="mc-kicker">Movimientos</span><h2>Mis comisiones</h2></div><button type="button" disabled={!comisiones.length} className="mc-btn mc-btn-soft" onClick={() => descargarComisiones(comisiones)}>Descargar CSV</button></div>{errorComisiones && <p role="alert" className="text-red-700">{errorComisiones}</p>}<div>{comisiones.map((item, index) => <p key={item.pedidoId + '-' + item.nivel + '-' + index} className="mc-commission-row"><span>{item.numero} · Nivel {item.nivel} · {item.fecha.slice(0, 10)}</span><strong>{dinero(item.monto)} · {item.estado}</strong></p>)}{!comisiones.length && !errorComisiones && <p className="mc-panel-empty">Aún no hay comisiones registradas.</p>}</div></section>
  </div>;
}
