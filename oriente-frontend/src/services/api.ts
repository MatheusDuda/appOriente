import axios from "axios";

// Cria instância do Axios com configurações base
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para adicionar token JWT automaticamente nas requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
