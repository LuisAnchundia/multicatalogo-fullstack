import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authorized, type ReportSummary, type TopRecord } from '../services/api';

export default function Dashboard() {
  const {token}=useAuth();const [summary,setSummary]=useState<ReportSummary|null>(null);
  const [products,setProducts]=useState<TopRecord[]>([]);const [referrals,setReferrals]=useState<TopRecord[]>([]);
  const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const [desde,setDesde]=useState('');const [hasta,setHasta]=useState('');
  useEffect(()=>{if(!token)return;let active=true;
    Promise.all([
      authorized<ReportSummary>(token,`/api/reportes/resumen?desde=${desde}&hasta=${hasta}`),
      authorized<TopRecord[]>(token,'/api/reportes/top-productos'),
      authorized<TopRecord[]>(token,'/api/reportes/top-referidos')
    ]).then(([a,b,c])=>{if(active){setSummary(a);setProducts(b);setReferrals(c);setLoading(false);}}).catch(cause=>{if(active){setError((cause as Error).message);setLoading(false);}});
    return()=>{active=false;};
  },[token,desde,hasta]);
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Resumen del negocio</h1>
    <div className="flex flex-wrap gap-3"><label>Desde <input type="date" className="rounded border p-2" value={desde} onChange={e=>setDesde(e.target.value)}/></label><label>Hasta <input type="date" className="rounded border p-2" value={hasta} onChange={e=>setHasta(e.target.value)}/></label></div>
    {loading&&<p role="status">Cargando reportes...</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}
    {summary&&<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Ventas',`$${summary.ventas.toFixed(2)}`],['Pedidos',String(summary.pedidos)],['Ticket promedio',`$${summary.ticketPromedio.toFixed(2)}`],['Comisiones devengadas',`$${summary.comisiones.toFixed(2)}`]
    ].map(([label,value])=><div key={label} className="rounded border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}</div>}
    {!loading&&summary?.pedidos===0&&<p className="rounded border bg-white p-4 text-slate-500">No hay ventas en el periodo seleccionado.</p>}
    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded border bg-white p-5"><h2 className="font-semibold mb-3">Productos más vendidos (histórico)</h2>{products.map((x,i)=><p key={`${x.nombre}-${i}`} className="border-b py-2">{x.nombre} · ${x.total.toFixed(2)}</p>)}{!products.length&&<p className="text-slate-500">Sin ventas todavía.</p>}</section><section className="rounded border bg-white p-5"><h2 className="font-semibold mb-3">Ventas de la red por usuario (histórico)</h2>{referrals.map((x,i)=><p key={`${x.nombre}-${i}`} className="border-b py-2">{x.nombre} · ${x.total.toFixed(2)}</p>)}{!referrals.length&&<p className="text-slate-500">Sin ventas de referidos todavía.</p>}</section></div>
  </div>;
}
