import api from "./api";
import type {
    User,
    UserListResponse,
    UserUpdateRequest,
    UserChangePasswordRequest,
    ApiResponse,
    UserRole,
} from "../types";

/**
 * Serviço para gerenciar usuários
 */
const userService = {
    /**
     * Lista todos os usuários com paginação
     * @param skip - Número de registros para pular (padrão: 0)
     * @param limit - Registros por página (padrão: 10, max: 100)
     * @returns Lista paginada de usuários
     */
    async getUsers(skip: number = 0, limit: number = 10): Promise<UserListResponse> {
        const response = await api.get<ApiResponse<UserListResponse>>("/api/users", {
            params: { skip, limit },
        });
        return response.data.data;
    },

    /**
     * Busca um usuário por ID
     * @param userId - ID do usuário
     * @returns Dados do usuário
     */
    async getUserById(userId: number): Promise<User> {
        const response = await api.get<ApiResponse<User>>(`/api/users/${userId}`);
        return response.data.data;
    },

    /**
     * Atualiza dados de um usuário
     * @param userId - ID do usuário
     * @param data - Dados para atualização
     * @returns Usuário atualizado
     */
    async updateUser(userId: number, data: UserUpdateRequest): Promise<User> {
        const response = await api.put<ApiResponse<User>>(`/api/users/${userId}`, data);
        return response.data.data;
    },

    /**
     * Altera senha do usuário
     * @param userId - ID do usuário
     * @param oldPassword - Senha antiga
     * @param newPassword - Nova senha
     */
    async changePassword(
        userId: number,
        oldPassword: string,
        newPassword: string
    ): Promise<void> {
        const payload: UserChangePasswordRequest = {
            old_password: oldPassword,
            new_password: newPassword,
        };
        await api.put(`/api/users/${userId}/password`, payload);
    },

    /**
     * Desativa uma conta de usuário (soft delete)
     * @param userId - ID do usuário
     */
    async deleteUser(userId: number): Promise<void> {
        await api.delete(`/api/users/${userId}`);
    },

    /**
     * Reativa uma conta de usuário desativada
     * Apenas ADMIN pode realizar esta ação
     * @param userId - ID do usuário
     * @returns Usuário reativado
     */
    async activateUser(userId: number): Promise<User> {
        const response = await api.patch<ApiResponse<User>>(`/api/users/${userId}/activate`);
        return response.data.data;
    },

    /**
     * Atualiza a role/função de um usuário
     * Apenas ADMIN pode realizar esta ação
     * @param userId - ID do usuário
     * @param role - Nova role (ADMIN, USER, MANAGER)
     * @returns Usuário com role atualizada
     */
    async updateUserRole(userId: number, role: UserRole): Promise<User> {
        const response = await api.patch<ApiResponse<User>>(`/api/users/${userId}/role`, { role });
        return response.data.data;
    },
};

export default userService;
