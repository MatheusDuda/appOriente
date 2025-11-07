import api from "./api";
import type {
    Team,
    TeamListItem,
    TeamDetailed,
    TeamCreateRequest,
    TeamUpdateRequest,
    AddMembersRequest,
    AddMembersResponse,
    TeamStats,
    ApiResponse,
} from "../types";

/**
 * Serviço para gerenciar equipes
 */
const teamService = {
    /**
     * Cria uma nova equipe
     * Apenas ADMIN pode realizar esta ação
     * @param data - Dados da equipe
     * @returns Equipe criada
     */
    async createTeam(data: TeamCreateRequest): Promise<Team> {
        const response = await api.post<ApiResponse<Team>>("/api/teams", data);
        return response.data.data;
    },

    /**
     * Lista todas as equipes ativas
     * @returns Lista de equipes
     */
    async getTeams(): Promise<TeamListItem[]> {
        const response = await api.get<ApiResponse<TeamListItem[]>>("/api/teams");
        return response.data.data;
    },

    /**
     * Lista equipes do usuário atual (como líder ou membro)
     * @returns Lista de equipes do usuário
     */
    async getMyTeams(): Promise<TeamListItem[]> {
        const response = await api.get<ApiResponse<TeamListItem[]>>("/api/teams/my-teams");
        return response.data.data;
    },

    /**
     * Busca uma equipe por ID com detalhes completos
     * Usuário deve ser membro, líder ou admin
     * @param teamId - ID da equipe
     * @returns Detalhes completos da equipe incluindo projetos
     */
    async getTeamById(teamId: number): Promise<TeamDetailed> {
        const response = await api.get<ApiResponse<TeamDetailed>>(`/api/teams/${teamId}`);
        return response.data.data;
    },

    /**
     * Atualiza uma equipe
     * Apenas líder ou ADMIN pode realizar esta ação
     * @param teamId - ID da equipe
     * @param data - Dados para atualização
     * @returns Equipe atualizada
     */
    async updateTeam(teamId: number, data: TeamUpdateRequest): Promise<Team> {
        const response = await api.put<ApiResponse<Team>>(`/api/teams/${teamId}`, data);
        return response.data.data;
    },

    /**
     * Deleta uma equipe
     * Apenas ADMIN pode realizar esta ação
     * Equipe não pode ter projetos ativos
     * @param teamId - ID da equipe
     */
    async deleteTeam(teamId: number): Promise<void> {
        await api.delete(`/api/teams/${teamId}`);
    },

    /**
     * Adiciona membros à equipe
     * Apenas líder ou ADMIN pode realizar esta ação
     * @param teamId - ID da equipe
     * @param userIds - IDs dos usuários a serem adicionados
     * @returns Resultado da operação com membros adicionados/já existentes/não encontrados
     */
    async addMembers(teamId: number, userIds: number[]): Promise<AddMembersResponse> {
        const payload: AddMembersRequest = { user_ids: userIds };
        const response = await api.post<ApiResponse<AddMembersResponse>>(
            `/api/teams/${teamId}/members`,
            payload
        );
        return response.data.data;
    },

    /**
     * Remove um membro da equipe
     * Apenas líder ou ADMIN pode realizar esta ação
     * Não pode remover o líder
     * @param teamId - ID da equipe
     * @param userId - ID do usuário a ser removido
     */
    async removeMember(teamId: number, userId: number): Promise<void> {
        await api.delete(`/api/teams/${teamId}/members/${userId}`);
    },

    /**
     * Busca estatísticas da equipe
     * @param teamId - ID da equipe
     * @returns Estatísticas (membros, projetos, tarefas)
     */
    async getTeamStats(teamId: number): Promise<TeamStats> {
        const response = await api.get<ApiResponse<TeamStats>>(`/api/teams/${teamId}/stats`);
        return response.data.data;
    },
};

export default teamService;
