import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  token: string | null;              // Token devuelto por la API de Go
  login: (email: string, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Ya no guardamos un booleano aparte: hay sesión si existe token.
  const isAuthenticated = token !== null;

  const login = (email: string, nuevoToken: string) => {
    setUserEmail(email);
    setToken(nuevoToken);
  };

  const logout = () => {
    setUserEmail(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
