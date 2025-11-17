import api from "./api";
import type {
    Card,
    Comment,
    CommentCreate,
    CommentUpdate,
    CardHistoryListResponse,
    CardUpdateRequest,
    CardStatusUpdateRequest,
    CardMoveRequest,
    Tag,
    TagCreateRequest,
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

    /**
     * Atualiza os dados de um card
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param data - Dados para atualização
     * @returns Card atualizado
     */
    async updateCard(
        projectId: number,
        cardId: string,
        data: CardUpdateRequest
    ): Promise<Card> {
        const response = await api.put<Card>(
            `/api/projects/${projectId}/cards/${cardId}`,
            data
        );
        return response.data;
    },

    /**
     * Deleta um card
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     */
    async deleteCard(projectId: number, cardId: string): Promise<void> {
        await api.delete(`/api/projects/${projectId}/cards/${cardId}`);
    },

    /**
     * Atualiza o status de um card (arquivar/restaurar)
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param status - Novo status (active, archived, deleted)
     * @returns Card atualizado
     */
    async updateCardStatus(
        projectId: number,
        cardId: string,
        status: "active" | "archived" | "deleted"
    ): Promise<Card> {
        const payload: CardStatusUpdateRequest = { status };
        const response = await api.patch<Card>(
            `/api/projects/${projectId}/cards/${cardId}/status`,
            payload
        );
        return response.data;
    },

    /**
     * Move um card para outra coluna
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param columnId - ID da coluna de destino
     * @param newPosition - Nova posição na coluna
     * @returns Card movido
     */
    async moveCard(
        projectId: number,
        cardId: string,
        columnId: number,
        newPosition: number
    ): Promise<Card> {
        const payload: CardMoveRequest = { column_id: columnId, new_position: newPosition };
        const response = await api.patch<Card>(
            `/api/projects/${projectId}/cards/${cardId}/move`,
            payload
        );
        return response.data;
    },

    /**
     * Lista todas as tags de um projeto
     * @param projectId - ID do projeto
     * @returns Lista de tags
     */
    async getProjectTags(projectId: number): Promise<Tag[]> {
        const response = await api.get<Tag[]>(
            `/api/projects/${projectId}/tags`
        );
        return response.data;
    },

    /**
     * Cria uma nova tag no projeto
     * @param projectId - ID do projeto
     * @param data - Dados da tag
     * @returns Tag criada
     */
    async createTag(projectId: number, data: TagCreateRequest): Promise<Tag> {
        const response = await api.post<Tag>(
            `/api/projects/${projectId}/tags`,
            data
        );
        return response.data;
    },
};

export default cardService;
