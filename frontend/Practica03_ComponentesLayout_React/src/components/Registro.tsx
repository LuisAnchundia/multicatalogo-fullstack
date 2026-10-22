import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { IconEye, IconEyeOff } from './Icons';

export default function Registro() {
  const [params] = useSearchParams();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
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
      <div><label htmlFor="registro-password" className="block">Contraseña (mínimo 8 caracteres)</label>
      <div className="relative mt-1"><input id="registro-password" className="w-full rounded border p-3 pr-14" type={mostrarPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="button" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={mostrarPassword} onClick={() => setMostrarPassword(value => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-700">{mostrarPassword ? <IconEyeOff /> : <IconEye />}</button>
      </div></div>
      <label className="block">Código de referido (opcional)<input className="mt-1 w-full rounded border p-3" value={ref} onChange={e=>setRef(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded bg-indigo-600 p-3 font-semibold text-white disabled:opacity-50">{busy ? 'Creando...' : 'Registrarme'}</button>
    </form>}
    <Link className="text-indigo-700 underline" to="/login">Volver al inicio de sesión</Link>
  </section></main>;
}
