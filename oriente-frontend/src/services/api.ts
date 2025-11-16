import axios from "axios";

// Cria instância do Axios com configurações base
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
    timeout: 60000, // 60 segundos para permitir download de PDFs grandes
});

// Interceptor para adicionar token JWT automaticamente nas requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Adicionar Content-Type apenas para requisições JSON (não blob/file downloads)
        if (!config.responseType || config.responseType === 'json') {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para tratar respostas de erro
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Se receber 401 (Unauthorized), limpa o token e redireciona para login
        if (error.response?.status === 401) {
            console.log("[API Interceptor] 401 Unauthorized - Limpando token e redirecionando");
            localStorage.removeItem("auth_token");

            // Redireciona para raiz (/) em vez de /login para evitar loops
            // O RedirectIfAuth vai detectar que não está autenticado e mostrar o login
            // Usamos replace para não adicionar ao histórico
            if (window.location.pathname !== "/") {
                window.location.replace("/");
            }
        }
        return Promise.reject(error);
    }
);

export default api;
