import api from "./api";
import type {
    Project,
    ProjectSummary,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectBoard,
    KanbanColumn,
    ColumnCreateRequest,
    Card,
    CardCreateRequest,
    CardMoveRequest,
    ApiResponse,
} from "../types";

/**
 * Serviço para gerenciar projetos, colunas e cards
 */
const projectService = {
    // ========================================
    // PROJETOS
    // ========================================

    /**
     * Cria um novo projeto
     * Owner é automaticamente o usuário autenticado
     * @param data - Dados do projeto (incluindo team_id obrigatório)
     * @returns Projeto criado
     */
    async createProject(data: ProjectCreateRequest): Promise<Project> {
        console.log("projectService.createProject - Enviando dados:", data);
        const response = await api.post<Project>("/api/projects", data);
        console.log("projectService.createProject - Projeto criado:", response.data);
        // A API retorna diretamente o objeto, sem wrapper ApiResponse
        return response.data;
    },

    /**
     * Lista projetos do usuário autenticado
     * @returns Lista resumida de projetos
     */
    async getProjects(): Promise<ProjectSummary[]> {
        console.log("projectService.getProjects - Fazendo requisição...");
        const response = await api.get<ProjectSummary[]>("/api/projects");
        console.log("projectService.getProjects - Resposta completa:", response);
        console.log("projectService.getProjects - response.data:", response.data);
        // A API retorna diretamente o array, sem wrapper ApiResponse
        return response.data;
    },

    /**
     * Busca um projeto por ID
     * Usuário deve ser owner ou membro
     * @param projectId - ID do projeto
     * @returns Dados completos do projeto
     */
    async getProjectById(projectId: number): Promise<Project> {
        const response = await api.get<Project>(`/api/projects/${projectId}`);
        return response.data;
    },

    /**
     * Atualiza um projeto
     * @param projectId - ID do projeto
     * @param data - Dados para atualização
     * @returns Projeto atualizado
     */
    async updateProject(projectId: number, data: ProjectUpdateRequest): Promise<Project> {
        const response = await api.put<Project>(
            `/api/projects/${projectId}`,
            data
        );
        return response.data;
    },

    /**
     * Deleta um projeto
     * @param projectId - ID do projeto
     */
    async deleteProject(projectId: number): Promise<void> {
        await api.delete(`/api/projects/${projectId}`);
    },

    /**
     * Busca a visão completa do board Kanban
     * @param projectId - ID do projeto
     * @returns Board com todas as colunas e cards
     */
    async getProjectBoard(projectId: number): Promise<ProjectBoard> {
        const response = await api.get<ProjectBoard>(
            `/api/projects/${projectId}/board`
        );
        return response.data;
    },

    // ========================================
    // COLUNAS
    // ========================================

    /**
     * Cria uma nova coluna no projeto
     * @param projectId - ID do projeto
     * @param data - Dados da coluna
     * @returns Coluna criada
     */
    async createColumn(projectId: number, data: ColumnCreateRequest): Promise<KanbanColumn> {
        const response = await api.post<KanbanColumn>(
            `/api/projects/${projectId}/columns`,
            data
        );
        return response.data;
    },

    /**
     * Lista todas as colunas do projeto
     * @param projectId - ID do projeto
     * @returns Lista de colunas
     */
    async getColumns(projectId: number): Promise<KanbanColumn[]> {
        const response = await api.get<KanbanColumn[]>(
            `/api/projects/${projectId}/columns`
        );
        return response.data;
    },

    // ========================================
    // CARDS/TAREFAS
    // ========================================

    /**
     * Cria um novo card/tarefa
     * @param projectId - ID do projeto
     * @param data - Dados do card
     * @returns Card criado
     */
    async createCard(projectId: number, data: CardCreateRequest): Promise<Card> {
        const response = await api.post<Card>(
            `/api/projects/${projectId}/cards`,
            data
        );
        return response.data;
    },

    /**
     * Lista cards do projeto com filtros opcionais
     * @param projectId - ID do projeto
     * @param filters - Filtros opcionais (status, priority, column_id, etc.)
     * @returns Lista de cards
     */
    async getCards(projectId: number, filters?: Record<string, any>): Promise<Card[]> {
        const response = await api.get<Card[]>(
            `/api/projects/${projectId}/cards`,
            { params: filters }
        );
        return response.data;
    },

    /**
     * Busca um card por ID
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @returns Dados completos do card
     */
    async getCard(projectId: number, cardId: string): Promise<Card> {
        const response = await api.get<Card>(
            `/api/projects/${projectId}/cards/${cardId}`
        );
        return response.data;
    },

    /**
     * Move um card para outra coluna/posição (drag & drop)
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param data - Nova coluna e posição
     * @returns Card atualizado
     */
    async moveCard(projectId: number, cardId: number, data: CardMoveRequest): Promise<Card> {
        const response = await api.patch<Card>(
            `/api/projects/${projectId}/cards/${cardId}/move`,
            data
        );
        return response.data;
    },
};

export default projectService;
