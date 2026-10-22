import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { authorized, type AdminProduct, type Page } from '../services/api';

type ProductForm = Pick<AdminProduct, 'nombre'|'descripcion'|'precio'|'categoria'|'img'|'stock'|'galeria'>;
const blank: ProductForm = { nombre: '', descripcion: '', precio: 0, categoria: '', img: '', stock: 0, galeria: [] };
export default function AdminProductos() {
  const { token } = useAuth();
  const [data, setData] = useState<Page<AdminProduct>>({ data: [], page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<ProductForm>(blank);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { if (!token) return; try { setData(await authorized<Page<AdminProduct>>(token, `/api/admin/productos?page=${page}&limit=10&q=${encodeURIComponent(q)}`)); setError(''); } catch(e) { setError((e as Error).message); } }, [token,page,q]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  async function save(e: FormEvent) {
    e.preventDefault(); if (!token) return; setBusy(true); setError('');
    try { await authorized<AdminProduct>(token, editing ? `/api/productos/${editing}` : '/api/productos', editing ? 'PUT' : 'POST', form); setForm(blank); setEditing(null); await refresh(); }
    catch(cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }
  async function toggle(item: AdminProduct) {
    if (!token || !window.confirm(`${item.activo ? 'Desactivar' : 'Activar'} ${item.nombre}?`)) return;
    try { await authorized<void>(token, item.activo ? `/api/productos/${item.id}` : `/api/productos/${item.id}/activar`, item.activo ? 'DELETE' : 'PATCH'); await refresh(); }
    catch(cause) { setError((cause as Error).message); }
  }
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Productos</h1>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <form onSubmit={save} className="rounded-lg bg-white p-4 space-y-3 border">
      <h2 className="font-semibold">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Nombre<input required className="block w-full rounded border p-2" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label>
        <label>Categoría<input required className="block w-full rounded border p-2" value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}/></label>
        <label>Precio<input required min="0.01" step="0.01" type="number" className="block w-full rounded border p-2" value={form.precio} onChange={e=>setForm({...form,precio:Number(e.target.value)})}/></label>
        <label>Stock<input required min="0" type="number" className="block w-full rounded border p-2" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})}/></label>
        <label className="sm:col-span-2">URL de imagen<input type="url" className="block w-full rounded border p-2" value={form.img} onChange={e=>setForm({...form,img:e.target.value})}/></label>
        <label className="sm:col-span-2">Descripción<textarea className="block w-full rounded border p-2" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})}/></label>
      </div><div className="flex gap-3"><button disabled={busy} className="rounded bg-indigo-600 px-4 py-2 text-white">Guardar</button>{editing && <button type="button" onClick={()=>{setEditing(null);setForm(blank);}} className="rounded border px-4 py-2">Cancelar</button>}</div>
    </form>
    <div className="rounded-lg border bg-white p-4"><label>Buscar<input className="ml-2 rounded border p-2" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/></label>
      <div className="mt-4 space-y-2">{data.data.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2"><div className="flex items-center gap-3">{item.img && <img src={item.img} alt="" className="h-12 w-12 rounded object-cover"/>}<span><strong>{item.nombre}</strong><br/><small>{item.categoria} · ${item.precio.toFixed(2)} · Stock {item.stock} · {item.activo?'Activo':'Inactivo'}</small></span></div><div className="flex gap-2"><button className="text-indigo-700 underline" onClick={()=>{setEditing(item.id);setForm(item);window.scrollTo(0,0);}}>Editar</button><button className="text-red-700 underline" onClick={()=>void toggle(item)}>{item.activo?'Desactivar':'Activar'}</button></div></div>)}{!data.data.length && <p className="text-slate-500">No hay productos.</p>}</div>
      <div className="mt-4 flex items-center gap-3"><button disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</button><span>Página {page} · {data.total} productos</span><button disabled={page*10>=data.total} onClick={()=>setPage(page+1)}>Siguiente</button></div>
    </div>
  </div>;
}
