import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authorized, type Order, type Page } from '../services/api';

export default function Pedidos({ admin = false }: { admin?: boolean }) {
  const {token}=useAuth();const [page,setPage]=useState(1);const [estado,setEstado]=useState('');
  const [data,setData]=useState<Page<Order>>({data:[],page:1,limit:10,total:0});const [detail,setDetail]=useState<Order|null>(null);const [error,setError]=useState('');
  const refresh=useCallback(async()=>{if(!token)return;try{setData(await authorized<Page<Order>>(token,`/api/pedidos${admin?'':'/mios'}?page=${page}&limit=10&estado=${estado}`));setError('');}catch(cause){setError((cause as Error).message);}},[token,page,estado,admin]);
  useEffect(()=>{const timer=window.setTimeout(()=>void refresh(),0);return()=>window.clearTimeout(timer);},[refresh]);
  async function show(id:number){if(!token)return;try{setDetail(detail?.id===id?null:await authorized<Order>(token,`/api/pedidos/${id}`));}catch(cause){setError((cause as Error).message);}}
  async function change(item:Order,next:string){if(!token)return;if(next==='cancelado'&&!window.confirm(`¿Cancelar ${item.numero} y devolver el stock?`))return;try{await authorized<void>(token,`/api/pedidos/${item.id}/estado`,'PATCH',{estado:next});setDetail(null);await refresh();}catch(cause){setError((cause as Error).message);}}
  const next=(s:string)=>s==='pendiente'?['preparando','cancelado']:s==='preparando'?['enviado']:s==='enviado'?['entregado']:[];
  return <div className="space-y-4"><h1 className="text-2xl font-bold">{admin?'Gestión de pedidos':'Mis pedidos'}</h1>{error&&<p role="alert" className="text-red-700">{error}</p>}
    {admin&&<label>Estado <select value={estado} className="rounded border p-2" onChange={e=>{setEstado(e.target.value);setPage(1);}}><option value="">Todos</option>{['pendiente','preparando','enviado','entregado','cancelado'].map(s=><option key={s}>{s}</option>)}</select></label>}
    <div className="rounded border bg-white p-4 space-y-3">{data.data.map(item=><div key={item.id} className="border-b pb-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{item.numero}</strong><p className="text-sm text-slate-600">{new Date(item.fecha).toLocaleDateString()} · ${item.total.toFixed(2)} · {item.estado}{admin&&` · ${item.email}`}</p></div><div className="flex gap-2 flex-wrap"><button className="text-indigo-700 underline" onClick={()=>void show(item.id)}>{detail?.id===item.id?'Ocultar':'Ver detalle'}</button>{admin&&next(item.estado).map(s=><button key={s} className="rounded border px-2 py-1" onClick={()=>void change(item,s)}>{s}</button>)}</div></div>{detail?.id===item.id&&<ul className="mt-2 bg-slate-50 p-3 text-sm">{detail.items?.map((x,i)=><li key={i}>{x.cantidad} × {x.nombre} · ${x.precio.toFixed(2)}</li>)}</ul>}</div>)}{!data.data.length&&<p className="text-slate-500">No hay pedidos para mostrar.</p>}
    <div className="flex gap-4"><button disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</button><span>Página {page} · {data.total} pedidos</span><button disabled={page*10>=data.total} onClick={()=>setPage(page+1)}>Siguiente</button></div></div>
  </div>;
}
