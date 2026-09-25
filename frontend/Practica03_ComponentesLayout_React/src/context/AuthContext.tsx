import { createContext, useContext, useState, type ReactNode } from 'react';

export type Rol = 'admin' | 'cliente';
export interface Usuario { email: string; rol: Rol }
interface Sesion { user: Usuario; token: string }
interface AuthContextType {
  isAuthenticated: boolean;
  user: Usuario | null;
  token: string | null;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
}

const SESSION_KEY = 'multicatalogo_sesion';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Conserva la sesión al recargar esta pestaña. Los tokens de la API son ficticios;
// la autenticación real con JWT corresponde a la siguiente unidad.
function leerSesion(): Sesion | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
    if (typeof saved?.user?.email === 'string' && saved.user.email &&
        ['admin', 'cliente'].includes(saved.user.rol) &&
        typeof saved.token === 'string' && saved.token) return saved;
  } catch { /* Una sesión dañada o almacenamiento bloqueado requiere login. */ }
  return null;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);
  const login = (user: Usuario, token: string) => {
    const siguiente = { user, token };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(siguiente)); } catch { /* Sesión en memoria. */ }
    setSesion(siguiente);
  };
  const logout = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Sesión en memoria. */ }
    setSesion(null);
  };
  return (
    <AuthContext.Provider value={{ isAuthenticated: sesion !== null, user: sesion?.user ?? null, token: sesion?.token ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
