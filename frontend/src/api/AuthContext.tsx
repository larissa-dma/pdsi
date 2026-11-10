import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, login as apiLogin, logout as apiLogout } from './client';
import type { Usuario } from './client';

interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (identificador: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get<Usuario>('/me')
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []);

  const entrar = useCallback(async (identificador: string, senha: string) => {
    await apiLogin(identificador, senha);
    const me = await api.get<Usuario>('/me');
    setUsuario(me);
  }, []);

  const sair = useCallback(async () => {
    await apiLogout();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
