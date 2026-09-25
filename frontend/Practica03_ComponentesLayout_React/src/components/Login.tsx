import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();
  if (user) return <Navigate to={user.rol === 'admin' ? '/' : '/tienda'} replace />;

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
          ? 'No se pudo conectar con el servidor. ¿Está corriendo el backend en el puerto 3000?'
          : (err as Error).message;
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 sm:p-8 border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">MultiCatálogo</h2>
          <p className="text-slate-500 mt-2">Ingresa a tu cuenta para continuar</p>
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
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
              placeholder="admin@upse.edu.ec"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="login-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition"
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-600 space-y-1">
          <p className="font-semibold">Cuentas de prueba · contraseña: 123456</p>
          <p>Admin: admin@upse.edu.ec</p>
          <p>Cliente: cliente@upse.edu.ec</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
