import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../services/api';
import { IconEye, IconEyeOff } from './Icons';
import InstallButton from './InstallButton';

const cuentasPrincipales = [
  { nombre: 'Administrador', email: 'admin@upse.edu.ec', password: '123456' },
  { nombre: 'Ana García · cliente', email: 'cliente@upse.edu.ec', password: '123456' },
  { nombre: 'Luis Poveda · cliente', email: 'luis.poveda@demo.local', password: '123456' },
];

const otrasCuentas = [
  { nombre: 'José Adrián García Muñoz', email: 'jose.garcia81@gmail.com', password: '12345678' },
  { nombre: 'Alfredo Luis Lázaro Benaviedes', email: 'alfredo.lazaro74@gmail.com', password: '12345678' },
  { nombre: 'Anahis Gabriela Arévalo Choez', email: 'anahis.arevalo24@gmail.com', password: '12345678' },
];

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [sinConexion, setSinConexion] = useState(!navigator.onLine);

  useEffect(() => {
    const actualizar = () => setSinConexion(!navigator.onLine);
    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
    return () => { window.removeEventListener('online', actualizar); window.removeEventListener('offline', actualizar); };
  }, []);

  const navigate = useNavigate();
  const { login, user } = useAuth();
  if (user) return <Navigate to={sinConexion ? '/catalogo-guardado' : user.rol === 'admin' ? '/' : '/tienda'} replace />;

  const usarCuenta = (cuenta: { email: string; password: string }) => {
    setEmail(cuenta.email);
    setPassword(cuenta.password);
    setError('');
  };

  // Ahora la validación la hace el backend en POST /api/login
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const data = await loginRequest(email.trim().toLowerCase(), password);
      login({ email: data.email, rol: data.rol }, data.token);
      navigate(data.rol === 'admin' ? '/' : '/tienda', { replace: true });
    } catch (err) {
      // Si el servidor está apagado fetch lanza TypeError, lo diferenciamos del 401
      const mensaje =
        err instanceof TypeError
          ? 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.'
          : (err as Error).message;
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 sm:p-8 border border-slate-200 my-6">
        <div className="text-center mb-8">
          <h1 className="mc-serif text-2xl sm:text-3xl font-bold text-indigo-700">MultiCatálogo</h1>
          <p className="text-slate-500 mt-2">Ingresa a tu cuenta para continuar</p>
          <div className="mt-4 flex justify-center"><InstallButton /></div>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="login-email"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
              placeholder="admin@upse.edu.ec"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                id="login-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 pr-14 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
                placeholder="••••••"
                required
              />
              <button type="button" aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={mostrarPassword} onClick={() => setMostrarPassword(value => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-700">
                {mostrarPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
        {sinConexion && <p className="mc-login-offline">Sin internet, puedes <Link to="/catalogo-guardado">ver el catálogo guardado</Link>.</p>}
        <p className="mt-4 text-center"><Link className="text-indigo-700 underline" to="/registro">Crear cuenta</Link></p>
        <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-xs text-slate-700 space-y-3">
          <div>
            <p className="font-semibold">Cuentas de prueba</p>
            <p className="mt-1 text-slate-500">Admin, Ana y Luis: <span className="font-mono">123456</span> · Cuentas nuevas: <span className="font-mono">12345678</span></p>
            <p className="mt-1 text-slate-500">Pulsa una cuenta para rellenar los campos.</p>
          </div>
          <div className="grid gap-1.5">
            {cuentasPrincipales.map(cuenta => <button key={cuenta.email} type="button" onClick={() => usarCuenta(cuenta)} className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50">
              <span className="block font-semibold">{cuenta.nombre}</span><span className="block text-slate-600">{cuenta.email}</span>
            </button>)}
          </div>
          <details><summary className="cursor-pointer font-semibold text-indigo-700">Ver otras 3 cuentas de prueba</summary><div className="mt-2 grid gap-1.5">
            {otrasCuentas.map(cuenta => <button key={cuenta.email} type="button" onClick={() => usarCuenta(cuenta)} className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50">
              <span className="block font-semibold">{cuenta.nombre}</span><span className="block text-slate-600">{cuenta.email}</span>
            </button>)}
          </div></details>
        </div>
      </div>
    </div>
  );
};

export default Login;
