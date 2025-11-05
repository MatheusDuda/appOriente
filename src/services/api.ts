import axios, { AxiosError } from 'axios';

// Configuração base da API
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
console.log('[API] Configurando API com baseURL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, token ? '(com token)' : '(sem token)');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Erro na requisição:', error.message);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros globais
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Resposta ${response.status}:`, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Timeout: O backend não respondeu a tempo');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('[API] Erro de rede: Não foi possível conectar ao backend');
    } else if (error.response) {
      console.error(`[API] Erro ${error.response.status}:`, error.response.config.url, error.response.data);
    } else {
      console.error('[API] Erro desconhecido:', error.message);
    }

    // Se receber 401 (Unauthorized), remover token e redirecionar para login
    if (error.response?.status === 401) {
      console.log('[API] Token inválido, redirecionando para login...');
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }

    // Retornar erro para ser tratado pelos serviços
    return Promise.reject(error);
  }
);

export default api;
