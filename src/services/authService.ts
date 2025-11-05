import api from './api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  ApiResponse,
} from '../types/api';

export const authService = {
  /**
   * Realiza login do usuário
   * POST /api/auth/login
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    console.log('[AuthService] Iniciando login para:', email);
    const response = await api.post<ApiResponse<LoginResponse>>(
      '/api/auth/login',
      {
        email,
        password,
      } as LoginRequest
    );

    const { token, user } = response.data.data!;

    // Armazenar token no localStorage
    console.log('[AuthService] Login bem-sucedido, armazenando token');
    localStorage.setItem('auth_token', token);

    return { token, user };
  },

  /**
   * Registra um novo usuário
   * POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<User> {
    console.log('[AuthService] Registrando novo usuário:', data.email);
    const response = await api.post<ApiResponse<User>>(
      '/api/auth/register',
      data
    );

    console.log('[AuthService] Usuário registrado com sucesso');
    return response.data.data!;
  },

  /**
   * Obtém dados do usuário autenticado
   * GET /api/auth/me
   */
  async getMe(): Promise<User> {
    console.log('[AuthService] Buscando dados do usuário autenticado');
    const response = await api.get<ApiResponse<User>>('/api/auth/me');
    console.log('[AuthService] Dados do usuário obtidos:', response.data.data?.email);
    return response.data.data!;
  },

  /**
   * Realiza logout do usuário
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    console.log('[AuthService] Fazendo logout');
    try {
      await api.post<ApiResponse<null>>('/api/auth/logout');
    } finally {
      // Sempre remover token, mesmo se a requisição falhar
      console.log('[AuthService] Removendo token do localStorage');
      localStorage.removeItem('auth_token');
    }
  },

  /**
   * Verifica se há um token válido
   */
  hasToken(): boolean {
    const hasToken = !!localStorage.getItem('auth_token');
    console.log('[AuthService] Verificando token:', hasToken ? 'Existe' : 'Não existe');
    return hasToken;
  },

  /**
   * Remove o token do localStorage
   */
  clearToken(): void {
    console.log('[AuthService] Limpando token');
    localStorage.removeItem('auth_token');
  },
};
