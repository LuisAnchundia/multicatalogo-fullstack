import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authorized, type ReportSummary, type TopRecord } from '../services/api';

const dinero = (valor: number) => '$' + valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaLocal = (fecha: Date) => [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, '0'), String(fecha.getDate()).padStart(2, '0')].join('-');

export default function Dashboard() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [products, setProducts] = useState<TopRecord[]>([]);
  const [referrals, setReferrals] = useState<TopRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      authorized<ReportSummary>(token, `/api/reportes/resumen?desde=${desde}&hasta=${hasta}`),
      authorized<TopRecord[]>(token, '/api/reportes/top-productos'),
      authorized<TopRecord[]>(token, '/api/reportes/top-referidos'),
    ]).then(([resumen, productos, referidos]) => {
      if (active) { setSummary(resumen); setProducts(productos); setReferrals(referidos); setError(''); setLoading(false); }
    }).catch(cause => { if (active) { setError((cause as Error).message); setLoading(false); } });
    return () => { active = false; };
  }, [token, desde, hasta]);

  function elegirPeriodo(periodo: 'historico' | 'mes' | 'treinta') {
    if (periodo === 'historico') { setDesde(''); setHasta(''); return; }
    const ahora = new Date();
    const inicio = periodo === 'mes' ? new Date(ahora.getFullYear(), ahora.getMonth(), 1) : new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 29);
    setDesde(fechaLocal(inicio)); setHasta(fechaLocal(ahora));
  }

  function exportar() {
    if (!summary) return;
    const filas = [
      ['Concepto', 'Valor'],
      ['Desde', desde || 'Inicio'], ['Hasta', hasta || 'Hoy'],
      ['Ventas', summary.ventas.toFixed(2)], ['Pedidos', String(summary.pedidos)],
      ['Ticket promedio', summary.ticketPromedio.toFixed(2)], ['Comisiones devengadas', summary.comisiones.toFixed(2)],
    ];
    const contenido = '\uFEFF' + filas.map(fila => fila.map(valor => `"${valor.replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a'); enlace.href = url; enlace.download = 'resumen-negocio.csv'; enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const indicadores = summary ? [
    { label: 'Ventas totales', value: dinero(summary.ventas), icon: '↗', foot: 'En el periodo seleccionado' },
    { label: 'Pedidos realizados', value: String(summary.pedidos), icon: '▣', foot: `Ticket promedio ${dinero(summary.ticketPromedio)}` },
    { label: 'Comisiones de red', value: dinero(summary.comisiones), icon: '◇', foot: 'Devengadas por las ventas' },
    { label: 'Ticket promedio', value: dinero(summary.ticketPromedio), icon: '◉', foot: 'Por pedido registrado' },
  ] : [];
  const maximo = Math.max(...products.map(item => item.total), 1);

  return <div className="mc-dashboard">
    <section className="mc-soft-banner mc-admin-welcome"><div><span className="mc-kicker">Modo administrador activo</span><h2>Tu negocio, en una sola vista.</h2><p>Consulta ventas, pedidos y comisiones con información actualizada del sistema.</p></div><Link to="/tienda" className="mc-btn mc-btn-soft">Ir a la tienda ↗</Link></section>
    <div className="mc-dashboard-heading"><div><span className="mc-kicker">Resumen ejecutivo</span><h1 className="mc-serif">Resumen del negocio</h1></div><button type="button" onClick={exportar} disabled={!summary} className="mc-btn mc-btn-primary">↓ Descargar resumen CSV</button></div>
    <div className="mc-period-controls"><div className="mc-period-tabs"><button type="button" onClick={() => elegirPeriodo('historico')} className={!desde && !hasta ? 'is-active' : ''}>Histórico</button><button type="button" onClick={() => elegirPeriodo('mes')}>Este mes</button><button type="button" onClick={() => elegirPeriodo('treinta')}>Últimos 30 días</button></div><div className="mc-dates"><label>Desde<input type="date" className="mc-field" value={desde} onChange={e => setDesde(e.target.value)} /></label><label>Hasta<input type="date" className="mc-field" value={hasta} onChange={e => setHasta(e.target.value)} /></label></div></div>
    {loading && <p role="status" className="mc-card mc-message">Cargando reportes...</p>}
    {error && <p role="alert" className="mc-card mc-message text-red-700">{error}</p>}
    {summary && <>
      <div className="mc-metrics">{indicadores.map(indicador => <article className="mc-card mc-metric" key={indicador.label}><div className="mc-metric-top"><span>{indicador.label}</span><b aria-hidden="true">{indicador.icon}</b></div><strong>{indicador.value}</strong><small>{indicador.foot}</small></article>)}</div>
      {summary.pedidos === 0 && <p className="mc-empty-note">No hay ventas en el periodo seleccionado. Puedes elegir otro rango de fechas.</p>}
      <div className="mc-analytics-grid">
        <section className="mc-card mc-analytics-panel"><div className="mc-panel-title"><div><span className="mc-kicker">Rendimiento del catálogo</span><h2>Productos más vendidos</h2><p>Importes acumulados del historial de pedidos.</p></div></div>{products.length ? <div className="mc-bar-list">{products.slice(0, 5).map((item, i) => <div className="mc-bar-row" key={`${item.nombre}-${i}`}><div><span>{item.nombre}</span><strong>{dinero(item.total)}</strong></div><span className="mc-bar-track"><span style={{ width: `${Math.max(5, item.total / maximo * 100)}%` }} /></span></div>)}</div> : <p className="mc-panel-empty">Sin ventas todavía. Los productos aparecerán aquí cuando haya pedidos.</p>}</section>
        <section className="mc-card mc-analytics-panel"><div className="mc-panel-title"><div><span className="mc-kicker">Comunidad</span><h2>Ventas de la red</h2><p>Personas con actividad en el historial.</p></div></div>{referrals.length ? <ol className="mc-top-list">{referrals.slice(0, 5).map((item, i) => <li key={`${item.nombre}-${i}`}><span className="mc-rank">{i + 1}</span><span>{item.nombre}</span><strong>{dinero(item.total)}</strong></li>)}</ol> : <p className="mc-panel-empty">Sin ventas de referidos todavía.</p>}</section>
      </div>
      <section className="mc-shortcuts"><h2>Accesos directos a módulos</h2><div>{[
        { label: 'Gestión de catálogo', to: '/admin/productos', icon: '▣', hint: 'Productos, precios y stock' },
        { label: 'Gestión de usuarios', to: '/admin/usuarios', icon: '♙', hint: 'Cuentas y roles' },
        { label: 'Liquidaciones', to: '/admin/liquidaciones', icon: '◇', hint: 'Comisiones por procesar' },
      ].map(item => <Link to={item.to} className="mc-card mc-shortcut" key={item.to}><span className="mc-shortcut-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.label}</strong><small>{item.hint}</small></span><b aria-hidden="true">›</b></Link>)}</div></section>
    </>}
  </div>;
}
