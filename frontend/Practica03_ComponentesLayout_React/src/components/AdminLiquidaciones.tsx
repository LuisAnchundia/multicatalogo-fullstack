import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authorized, type Liquidation } from '../services/api';

interface Debt { beneficiarioId: number; nombre: string; total: number }
export default function AdminLiquidaciones() {
  const {token}=useAuth(); const [debts,setDebts]=useState<Debt[]>([]);const [history,setHistory]=useState<Liquidation[]>([]);const [error,setError]=useState('');
  const refresh=useCallback(async()=>{if(!token)return;try{const [d,h]=await Promise.all([authorized<Debt[]>(token,'/api/liquidaciones/pendientes'),authorized<Liquidation[]>(token,'/api/liquidaciones')]);setDebts(d);setHistory(h);setError('');}catch(cause){setError((cause as Error).message);}},[token]);
  useEffect(()=>{const timer=window.setTimeout(()=>void refresh(),0);return()=>window.clearTimeout(timer);},[refresh]);
  async function pay(item:Debt){if(!token||!window.confirm(`Registrar liquidación de $${item.total.toFixed(2)} a ${item.nombre}?`))return;try{await authorized<Liquidation>(token,'/api/liquidaciones','POST',{beneficiarioId:item.beneficiarioId});await refresh();}catch(cause){setError((cause as Error).message);}}
  return <div className="space-y-5"><h1 className="text-2xl font-bold">Liquidaciones</h1><p className="text-sm text-slate-600">Este registro administrativo no transfiere dinero al banco.</p>{error&&<p role="alert" className="text-red-700">{error}</p>}
    <section className="rounded border bg-white p-4"><h2 className="font-semibold mb-3">Comisiones pendientes</h2>{debts.map(item=><div key={item.beneficiarioId} className="flex justify-between gap-3 border-b py-2"><span>{item.nombre} · ${item.total.toFixed(2)}</span><button className="text-indigo-700 underline" onClick={()=>void pay(item)}>Registrar pago</button></div>)}{!debts.length&&<p>No hay pagos pendientes.</p>}</section>
    <section className="rounded border bg-white p-4"><h2 className="font-semibold mb-3">Historial</h2>{history.map(item=><p key={item.id} className="border-b py-2">#{item.id} · Distribuidor {item.beneficiarioId} · ${item.total.toFixed(2)} · {new Date(item.fecha).toLocaleDateString()}</p>)}{!history.length&&<p>Todavía no hay liquidaciones.</p>}</section>
  </div>;
}
