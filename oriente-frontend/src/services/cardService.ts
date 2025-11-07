import api from "./api";
import type {
    Card,
    Comment,
    CommentCreate,
    CommentUpdate,
    CardHistoryListResponse,
} from "../types";

/**
 * Serviço para gerenciar cards e suas funcionalidades relacionadas
 */
const cardService = {
    /**
     * Busca os dados completos de um card
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @returns Dados do card
     */
    async getCard(projectId: number, cardId: string): Promise<Card> {
        const response = await api.get<Card>(
            `/api/projects/${projectId}/cards/${cardId}`
        );
        return response.data;
    },

    /**
     * Lista todos os comentários de um card
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @returns Lista de comentários
     */
    async getCardComments(
        projectId: number,
        cardId: string
    ): Promise<Comment[]> {
        const response = await api.get<Comment[]>(
            `/api/projects/${projectId}/cards/${cardId}/comments`
        );
        return response.data;
    },

    /**
     * Cria um novo comentário em um card
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param content - Conteúdo do comentário
     * @returns Comentário criado
     */
    async createComment(
        projectId: number,
        cardId: string,
        content: string
    ): Promise<Comment> {
        const payload: CommentCreate = { content };
        const response = await api.post<Comment>(
            `/api/projects/${projectId}/cards/${cardId}/comments`,
            payload
        );
        return response.data;
    },

    /**
     * Atualiza um comentário existente
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param commentId - ID do comentário
     * @param content - Novo conteúdo do comentário
     * @returns Comentário atualizado
     */
    async updateComment(
        projectId: number,
        cardId: string,
        commentId: number,
        content: string
    ): Promise<Comment> {
        const payload: CommentUpdate = { content };
        const response = await api.put<Comment>(
            `/api/projects/${projectId}/cards/${cardId}/comments/${commentId}`,
            payload
        );
        return response.data;
    },

    /**
     * Deleta um comentário
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param commentId - ID do comentário
     */
    async deleteComment(
        projectId: number,
        cardId: string,
        commentId: number
    ): Promise<void> {
        await api.delete(
            `/api/projects/${projectId}/cards/${cardId}/comments/${commentId}`
        );
    },

    /**
     * Busca o histórico de auditoria de um card com paginação
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param page - Número da página (padrão: 1)
     * @param size - Tamanho da página (padrão: 20)
     * @returns Histórico paginado do card
     */
    async getCardHistory(
        projectId: number,
        cardId: string,
        page: number = 1,
        size: number = 20
    ): Promise<CardHistoryListResponse> {
        const response = await api.get<CardHistoryListResponse>(
            `/api/projects/${projectId}/cards/${cardId}/history`,
            {
                params: { page, size },
            }
        );
        return response.data;
    },
};

export default cardService;
