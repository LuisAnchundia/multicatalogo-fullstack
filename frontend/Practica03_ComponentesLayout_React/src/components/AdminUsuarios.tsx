import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authorized, type Page, type UserRecord } from '../services/api';

export default function AdminUsuarios() {
  const { token, user } = useAuth(); const [page,setPage]=useState(1);
  const [data,setData]=useState<Page<UserRecord>>({data:[],page:1,limit:10,total:0});
  const [error,setError]=useState('');
  const refresh=useCallback(async()=>{if(!token)return;try{setData(await authorized<Page<UserRecord>>(token,`/api/usuarios?page=${page}&limit=10`));setError('');}catch(cause){setError((cause as Error).message);}},[token,page]);
  useEffect(()=>{const timer=window.setTimeout(()=>void refresh(),0);return()=>window.clearTimeout(timer);},[refresh]);
  async function change(item:UserRecord,rol:UserRecord['rol'],activo:boolean){if(!token)return;try{await authorized<void>(token,`/api/usuarios/${item.id}`,'PATCH',{rol,activo});await refresh();}catch(cause){setError((cause as Error).message);}}
  return <div className="space-y-4"><h1 className="text-2xl font-bold">Usuarios</h1>{error&&<p role="alert" className="text-red-700">{error}</p>}
    <div className="rounded border bg-white p-4 space-y-3">{data.data.map(item=><div key={item.id} className="border-b pb-3 flex flex-wrap items-center justify-between gap-3"><div><strong>{item.nombre}</strong><p className="text-sm text-slate-600">{item.email} · Código {item.codigoRef}</p></div><div className="flex items-center gap-3"><label>Rol <select className="rounded border p-2" value={item.rol} disabled={item.email===user?.email} onChange={e=>void change(item,e.target.value as UserRecord['rol'],item.activo)}><option value="cliente">Cliente</option><option value="admin">Admin</option></select></label><label><input type="checkbox" checked={item.activo} disabled={item.email===user?.email} onChange={e=>void change(item,item.rol,e.target.checked)}/> Activo</label></div></div>)}{!data.data.length&&<p>No hay usuarios.</p>}
    <div className="flex gap-4"><button disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</button><span>Página {page} · {data.total} usuarios</span><button disabled={page*10>=data.total} onClick={()=>setPage(page+1)}>Siguiente</button></div></div>
  </div>;
}
