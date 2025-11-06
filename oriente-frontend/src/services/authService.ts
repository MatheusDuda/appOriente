import api from "./api";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role?: string;
}

export interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

class AuthService {
    /**
     * Realiza login do usuário
     * @param credentials - Email e senha do usuário
     * @returns Token de acesso JWT
     */
    async login(credentials: LoginCredentials): Promise<string> {
        const response = await api.post<LoginResponse>(
            "/api/auth/login",
            credentials
        );
        return response.data.access_token;
    }

    /**
     * Registra novo usuário
     * @param data - Dados do novo usuário
     * @returns Dados do usuário criado
     */
    async register(data: RegisterData): Promise<UserData> {
        const response = await api.post<UserData>("/api/auth/register", data);
        return response.data;
    }

    /**
     * Busca dados do usuário autenticado
     * @returns Dados do usuário atual
     */
    async getCurrentUser(): Promise<UserData> {
        const response = await api.get<UserData>("/api/auth/me");
        return response.data;
    }

    /**
     * Realiza logout (apenas remove token local, backend é stateless)
     */
    logout(): void {
        localStorage.removeItem("auth_token");
    }
}

export const authService = new AuthService();
