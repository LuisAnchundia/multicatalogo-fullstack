import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function Registro() {
  const [params] = useSearchParams();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ref, setRef] = useState(params.get('ref') ?? '');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await apiRequest('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, email, password, ref }) }); setDone(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear la cuenta'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4"><section className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm space-y-5">
    <h1 className="text-2xl font-bold">Crear cuenta</h1>
    {done ? <p role="status">Cuenta creada. <Link className="text-indigo-700 underline" to="/login">Inicia sesión</Link> para continuar.</p> : <form onSubmit={submit} className="space-y-4">
      <label className="block">Nombre<input className="mt-1 w-full rounded border p-3" value={nombre} onChange={e=>setNombre(e.target.value)} required /></label>
      <label className="block">Correo<input className="mt-1 w-full rounded border p-3" type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
      <label className="block">Contraseña (mínimo 8 caracteres)<input className="mt-1 w-full rounded border p-3" type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required /></label>
      <label className="block">Código de referido (opcional)<input className="mt-1 w-full rounded border p-3" value={ref} onChange={e=>setRef(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded bg-indigo-600 p-3 font-semibold text-white disabled:opacity-50">{busy ? 'Creando...' : 'Registrarme'}</button>
    </form>}
    <Link className="text-indigo-700 underline" to="/login">Volver al inicio de sesión</Link>
  </section></main>;
}
