// src/components/MiRed.tsx
// Red multinivel visual (Tema 5):
// - Resumen: referidos activos, ventas de la red, comisiones del mes y nivel alcanzado
// - Árbol jerárquico recursivo de referidos con comisión calculada por nivel
import { contarRed, sumarVentasRed, nivelAlcanzado, comisionDeReferido, TASA_COMISION, type Referido } from '../data/red';
import { useRed } from '../hooks/useRed';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authorized, type Commission } from '../services/api';

// Colores y etiquetas por nivel para el árbol
const NIVEL_ESTILO: Record<number, { badge: string; border: string; tasa: string }> = {
  1: { badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-200", tasa: "10 %" },
  2: { badge: "bg-purple-100 text-purple-700", border: "border-purple-200", tasa: "5 %" },
  3: { badge: "bg-pink-100 text-pink-700", border: "border-pink-200", tasa: "2 %" },
};

// Componente recursivo: renderiza un referido y, debajo, a sus hijos
// Nota: la prop se llama "nodo" porque "ref" es una prop reservada en React 19
const NodoReferido = ({ nodo }: { nodo: Referido }) => {
  const estilo = NIVEL_ESTILO[nodo.nivel] ?? NIVEL_ESTILO[1];
  const comision = comisionDeReferido(nodo);

  return (
    <li>
      <div className={`bg-white rounded-lg border ${estilo.border} shadow-sm p-4 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
            {nodo.nombre.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{nodo.nombre}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${estilo.badge}`}>
              Nivel {nodo.nivel} · {estilo.tasa} comisión
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Ventas</p>
          <p className="font-bold text-slate-800">${nodo.ventas.toLocaleString()}</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            +${comision.toFixed(2)} para ti
          </p>
        </div>
      </div>

      {/* Hijos del referido (más profundidad en el árbol) */}
      {nodo.hijos && nodo.hijos.length > 0 && (
        <ul className="mt-3 ml-6 space-y-3 border-l-2 border-slate-200 pl-4">
          {nodo.hijos.map((hijo) => (
            <NodoReferido key={hijo.id} nodo={hijo} />
          ))}
        </ul>
      )}
    </li>
  );
};

const MiRed = () => {
  const { red, loading, error } = useRed();
  const { token } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [comisiones, setComisiones] = useState<Commission[]>([]);
  const [estadoCopia, setEstadoCopia] = useState('');
  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([authorized<{ codigo: string }>(token, '/api/referido/codigo'), authorized<Commission[]>(token, '/api/comisiones/mias')])
      .then(([ref, ledger]) => { if (active) { setCodigo(ref.codigo); setComisiones(ledger); } })
      .catch(() => { if (active) setEstadoCopia('No se pudo cargar el enlace o las comisiones.'); });
    return () => { active = false; };
  }, [token]);
  const enlace = codigo ? `${window.location.origin}/registro?ref=${encodeURIComponent(codigo)}` : '';
  async function copiar() { try { await navigator.clipboard.writeText(enlace); setEstadoCopia('Enlace copiado.'); } catch { setEstadoCopia('No se pudo copiar; selecciona el enlace manualmente.'); } }
  if (loading) return <p>Cargando red...</p>;
  if (!red) return <p role="alert" className="text-red-700">{error || 'No se pudo cargar la red'}</p>;
  // KPIs derivados de los datos de la red (funciones puras en data/red.ts)
  const referidosActivos = contarRed(red);
  const ventasRed = sumarVentasRed(red);
  const saldo = red.saldo ?? 0;
  const nivel = nivelAlcanzado(red.hijos?.length ?? 0);

  const resumen = [
    { etiqueta: "Referidos Activos", valor: referidosActivos.toString(), color: "text-indigo-600" },
    { etiqueta: "Ventas de la Red", valor: `$${ventasRed.toLocaleString()}`, color: "text-indigo-600" },
    { etiqueta: "Saldo de comisiones", valor: `$${saldo.toFixed(2)}`, color: "text-green-600" },
    { etiqueta: "Nivel Alcanzado", valor: nivel, color: "text-amber-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Mi Red de Referidos</h1>
      <p className="text-slate-500 mb-6">
        Estructura multinivel: gana el {TASA_COMISION[1] * 100} % de nivel 1, {TASA_COMISION[2] * 100} % de nivel 2 y {TASA_COMISION[3] * 100} % de nivel 3.
      </p>

      {/* ===== TARJETAS DE RESUMEN ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {resumen.map((item) => (
          <div key={item.etiqueta} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 uppercase font-semibold">{item.etiqueta}</p>
            <p className={`text-3xl font-bold mt-2 ${item.color}`}>{item.valor}</p>
          </div>
        ))}
      </div>

      {codigo && <section className="mb-6 rounded-lg border bg-white p-4"><h2 className="font-semibold mb-2">Invita a tu red</h2><div className="flex flex-wrap gap-2"><input aria-label="Enlace de referido" className="min-w-0 flex-1 rounded border p-2" readOnly value={enlace}/><button className="rounded bg-indigo-600 px-4 py-2 text-white" onClick={() => void copiar()}>Copiar enlace</button></div>{estadoCopia && <p role="status" className="mt-2 text-sm">{estadoCopia}</p>}</section>}

      {/* ===== ÁRBOL DE REFERIDOS ===== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Jerarquía de tu Red</h2>

        {/* Raíz: el usuario */}
        <div className="bg-slate-900 text-white rounded-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
              {red.nombre.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">{red.nombre}</p>
              <p className="text-xs text-slate-300">Nivel alcanzado: {nivel}</p>
            </div>
          </div>
          <p className="font-bold text-green-400">
            Saldo de comisiones: ${saldo.toFixed(2)}
          </p>
        </div>

        <ul className="space-y-3">
          {red.hijos?.map((hijo) => (
            <NodoReferido key={hijo.id} nodo={hijo} />
          ))}
        </ul>
        {!red.hijos?.length && <p className="text-slate-500">Aún no tienes referidos. Comparte tu enlace para empezar.</p>}
      </div>
      <section className="mt-6 rounded-lg border bg-white p-4"><h2 className="font-semibold mb-3">Mis comisiones</h2>{comisiones.map((item,i)=><p key={`${item.pedidoId}-${item.nivel}-${i}`} className="border-b py-2 text-sm">{item.numero} · Nivel {item.nivel} · ${item.monto.toFixed(2)} · {item.estado}</p>)}{!comisiones.length&&<p className="text-slate-500">Aún no hay comisiones registradas.</p>}</section>
    </div>
  );
};

export default MiRed;
