import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import type { User, RegisterRequest } from '../types/api';

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se há token ao carregar a aplicação
  useEffect(() => {
    const verifyToken = async () => {
      console.log('[AuthContext] Iniciando verificação de token...');

      if (authService.hasToken()) {
        console.log('[AuthContext] Token encontrado, verificando com backend...');
        try {
          const userData = await authService.getMe();
          console.log('[AuthContext] Usuário autenticado:', userData.email);
          setUser(userData);
        } catch (err: any) {
          // Token inválido ou expirado
          console.warn('[AuthContext] Erro ao verificar token:', err.message);
          console.log('[AuthContext] Limpando token inválido...');
          authService.clearToken();
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('[AuthContext] Nenhum token encontrado');
        setLoading(false);
      }
    };

    verifyToken().catch((err) => {
      console.error('[AuthContext] Erro inesperado na verificação de token:', err);
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Tentando fazer login...', email);
      setLoading(true);
      setError(null);

      const { user: userData } = await authService.login(email, password);
      console.log('[AuthContext] Login bem-sucedido:', userData.email);
      setUser(userData);
    } catch (err: any) {
      console.error('[AuthContext] Erro ao fazer login:', err);
      const message =
        err.response?.data?.detail ||
        'Erro ao fazer login. Verifique suas credenciais.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      console.log('[AuthContext] Tentando registrar usuário...', data.email);
      setLoading(true);
      setError(null);

      await authService.register(data);
      console.log('[AuthContext] Registro bem-sucedido');

      // Após registro bem-sucedido, fazer login automaticamente
      await login(data.email, data.password);
    } catch (err: any) {
      console.error('[AuthContext] Erro ao registrar:', err);
      const message =
        err.response?.data?.detail || 'Erro ao registrar usuário.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Fazendo logout...');
      setLoading(true);
      await authService.logout();
      console.log('[AuthContext] Logout bem-sucedido');
    } catch (err) {
      console.error('[AuthContext] Erro ao fazer logout:', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      user,
      loading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
