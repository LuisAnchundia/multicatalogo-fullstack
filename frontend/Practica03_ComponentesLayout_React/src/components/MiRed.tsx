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

  return <li>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        {tieneHijos ? <button type="button" aria-label={(visible ? 'Ocultar' : 'Mostrar') + ' referidos de ' + nodo.nombre}
          aria-expanded={visible} aria-controls={idHijos} disabled={mostrarRuta}
          onClick={() => setAbierto(actual => !actual)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-slate-50 text-slate-700 disabled:opacity-50">
          <span aria-hidden="true">{visible ? '−' : '+'}</span>
        </button> : <span className="w-9 shrink-0 text-center text-slate-300" aria-hidden="true">•</span>}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">{nodo.nombre.charAt(0)}</div>
        <div className="min-w-0"><p className="truncate font-semibold text-slate-800">{nodo.nombre}</p>
          <p className="text-xs text-slate-500">Nivel {nodo.nivel} · {[0, 10, 5, 2][nodo.nivel] ?? 0} % comisión{tieneHijos ? ' · ' + nodo.hijos?.length + (nodo.hijos?.length === 1 ? ' referido directo' : ' referidos directos') : ''}</p>
        </div>
      </div>
      <div className="text-left sm:text-right"><p className="text-xs text-slate-500">Ventas registradas</p>
        <p className="font-semibold text-slate-800">{dinero(nodo.ventas)}</p></div>
    </div>
    {tieneHijos && visible && <ul id={idHijos} className="ml-4 mt-3 space-y-3 border-l-2 border-slate-200 pl-4 sm:ml-6">
      {nodo.hijos?.map(hijo => <NodoReferido key={hijo.id} nodo={hijo} mostrarRuta={mostrarRuta} />)}
    </ul>}
  </li>;
}

function tendenciaMensual(comisiones: Commission[]) {
  const ahora = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - 5 + index, 1);
    const mes = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
    const total = comisiones.filter(item => item.estado !== 'revertida' && item.fecha.startsWith(mes))
      .reduce((suma, item) => suma + item.monto, 0);
    return { mes, etiqueta: fecha.toLocaleDateString('es-EC', { month: 'short' }), total };
  });
}

function descargarComisiones(comisiones: Commission[]) {
  const celda = (valor: string) => '"' + valor.replace(/"/g, '""') + '"';
  const filas = [
    ['Pedido', 'Fecha', 'Nivel', 'Monto (USD)', 'Estado'],
    ...comisiones.map(item => [item.numero, item.fecha.slice(0, 10), String(item.nivel), item.monto.toFixed(2), item.estado]),
  ];
  const contenido = '\uFEFF' + filas.map(fila => fila.map(celda).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'mis-comisiones.csv';
  enlace.click();
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
    authorized<{ codigo: string }>(token, '/api/referido/codigo')
      .then(ref => { if (active) setCodigo(ref.codigo); })
      .catch(() => { if (active) setEstadoCopia('No se pudo cargar el enlace de referido.'); });
    authorized<Commission[]>(token, '/api/comisiones/mias')
      .then(datos => { if (active) setComisiones(datos); })
      .catch(() => { if (active) setErrorComisiones('No se pudieron cargar las comisiones.'); });
    return () => { active = false; };
  }, [token]);

  const hayFiltros = Boolean(nombre.trim() || nivelFiltro || ventasFiltro);
  const resultado = useMemo(() => red && hayFiltros ? filtrarRed(red, {
    nombre,
    nivel: nivelFiltro ? Number(nivelFiltro) : null,
    ventasMinimas: ventasFiltro ? Number(ventasFiltro) : null,
  }) : null, [red, hayFiltros, nombre, nivelFiltro, ventasFiltro]);
  const meses = useMemo(() => tendenciaMensual(comisiones), [comisiones]);
  const maximo = Math.max(...meses.map(item => item.total), 0);

  async function copiar() {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + '/registro?ref=' + encodeURIComponent(codigo));
      setEstadoCopia('Enlace copiado.');
    } catch { setEstadoCopia('No se pudo copiar; selecciona el enlace manualmente.'); }
  }

  if (loading) return <div role="status" aria-label="Cargando red" className="space-y-4">
    <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map(item => <div key={item} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}</div>
    <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
  </div>;
  if (!red) return <p role="alert" className="text-red-700">{error || 'No se pudo cargar la red'}</p>;

  const saldo = red.saldo ?? 0;
  const nivel = nivelAlcanzado(red.hijos?.length ?? 0);
  const resumen = [
    { etiqueta: 'Referidos en la red', valor: String(contarRed(red)) },
    { etiqueta: 'Ventas de la red', valor: dinero(sumarVentasRed(red)) },
    { etiqueta: 'Saldo de comisiones', valor: dinero(saldo) },
    { etiqueta: 'Nivel alcanzado', valor: nivel },
  ];
  const enlace = codigo ? window.location.origin + '/registro?ref=' + encodeURIComponent(codigo) : '';
  const hijosVisibles = resultado?.red.hijos ?? red.hijos ?? [];

  return <div className="space-y-6">
    <header><h1 className="mb-2 text-2xl font-bold text-slate-800">Mi Red de Referidos</h1>
      <p className="text-slate-500">Explora tus referidos y consulta las comisiones registradas en cada nivel.</p></header>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {resumen.map(item => <div key={item.etiqueta} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">{item.etiqueta}</p><p className="mt-2 text-2xl font-bold text-indigo-700">{item.valor}</p>
      </div>)}
    </div>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Invita a alguien</h2>
      <p className="mb-3 text-sm text-slate-500">Comparte este enlace para que se registre en tu red.</p>
      {codigo && <div className="flex flex-wrap gap-2">
        <input aria-label="Enlace de referido" className="min-w-0 flex-1 rounded-lg border border-slate-300 p-2" readOnly value={enlace} onFocus={evento => evento.currentTarget.select()} />
        <button type="button" className="rounded-lg bg-indigo-700 px-4 py-2 font-medium text-white hover:bg-indigo-800" onClick={() => void copiar()}>Copiar enlace</button>
      </div>}
      {estadoCopia && <p role="status" className="mt-2 text-sm text-slate-600">{estadoCopia}</p>}
    </section>

    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-800">Jerarquía de tu Red</h2><p className="text-sm text-slate-500">Abre cada persona para ver sus referidos.</p></div>
        {hayFiltros && <button type="button" className="text-sm font-medium text-indigo-700 hover:underline" onClick={() => { setNombre(''); setNivelFiltro(''); setVentasFiltro(''); }}>Limpiar filtros</button>}
      </div>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">Buscar por nombre
          <input type="search" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2" placeholder="Nombre del referido" value={nombre} onChange={evento => setNombre(evento.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">Nivel
          <select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2" value={nivelFiltro} onChange={evento => setNivelFiltro(evento.target.value)}>
            <option value="">Todos los niveles</option><option value="1">Nivel 1</option><option value="2">Nivel 2</option><option value="3">Nivel 3</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">Ventas mínimas (USD)
          <input type="number" min="0" step="0.01" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2" placeholder="0.00" value={ventasFiltro} onChange={evento => setVentasFiltro(evento.target.value)} />
        </label>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900 p-4 text-white">
        <div><p className="font-semibold">{red.nombre}</p><p className="text-xs text-slate-300">Tu nivel: {nivel}</p></div>
        <p className="font-semibold text-emerald-300">Saldo: {dinero(saldo)}</p>
      </div>
      {hayFiltros && <p role="status" className="mb-3 text-sm text-slate-600">{resultado?.coincidencias ?? 0} {(resultado?.coincidencias ?? 0) === 1 ? 'coincidencia' : 'coincidencias'}</p>}
      {hijosVisibles.length ? <ul className="space-y-3">{hijosVisibles.map(hijo => <NodoReferido key={hijo.id} nodo={hijo} mostrarRuta={hayFiltros} />)}</ul>
        : <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
          {hayFiltros ? 'No hay referidos que coincidan con los filtros.' : 'Aún no tienes referidos. Comparte tu enlace para empezar.'}
        </p>}
    </section>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-800">Comisiones por mes</h2>
        <p className="mb-5 text-sm text-slate-500">Últimos seis meses, según los pedidos registrados.</p>
        {maximo > 0 ? <ul className="flex h-48 items-end justify-between gap-2" aria-label="Comisiones de los últimos seis meses">
          {meses.map(item => <li key={item.mes} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" aria-label={item.mes + ': ' + dinero(item.total)}>
            <span className="text-xs font-semibold text-slate-700">{item.total ? dinero(item.total) : '—'}</span>
            <div className="w-full max-w-12 rounded-t-md bg-indigo-600" style={{ height: Math.max(item.total ? 6 : 2, item.total / maximo * 125) + 'px' }} aria-hidden="true" />
            <span className="text-xs text-slate-500">{item.etiqueta}</span>
          </li>)}
        </ul> : <p className="rounded-lg bg-slate-50 p-6 text-sm text-slate-500">Aún no hay comisiones registradas en los últimos seis meses.</p>}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Mis comisiones</h2>
          <button type="button" disabled={!comisiones.length} className="rounded-lg border border-indigo-700 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => descargarComisiones(comisiones)}>Descargar CSV</button>
        </div>
        {errorComisiones && <p role="alert" className="text-sm text-red-700">{errorComisiones}</p>}
        <div className="max-h-52 overflow-y-auto">
          {comisiones.map((item, index) => <p key={item.pedidoId + '-' + item.nivel + '-' + index} className="flex flex-wrap justify-between gap-1 border-b border-slate-100 py-2 text-sm">
            <span>{item.numero} · Nivel {item.nivel} · {item.fecha.slice(0, 10)}</span><span className="font-medium">{dinero(item.monto)} · {item.estado}</span>
          </p>)}
          {!comisiones.length && !errorComisiones && <p className="text-sm text-slate-500">Aún no hay comisiones registradas.</p>}
        </div>
      </section>
    </div>
  </div>;
}
