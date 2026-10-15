import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Referido } from '../data/red';
import { getRed } from '../services/api';

export function useRed() {
  const { token } = useAuth();
  const [red, setRed] = useState<Referido | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    getRed(token)
      .then((data) => { if (active) setRed(data); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'No se pudo cargar la red'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  return { red, loading, error };
}
