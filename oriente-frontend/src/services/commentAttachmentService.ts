import api from "./api";
import type { CommentAttachment, CommentAttachmentListResponse } from "../types";
import attachmentService from "./attachmentService";

/**
 * Serviço para gerenciar anexos de comentários
 */
const commentAttachmentService = {
    /**
     * Faz upload de um anexo para um comentário
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param commentId - ID do comentário
     * @param file - Arquivo a ser enviado
     * @returns Anexo criado
     */
    async uploadAttachment(
        projectId: number,
        cardId: number,
        commentId: number,
        file: File
    ): Promise<CommentAttachment> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post<CommentAttachment>(
            `/api/projects/${projectId}/cards/${cardId}/comments/${commentId}/attachments`,
            formData
        );
        return response.data;
    },

    /**
     * Lista todos os anexos de um comentário
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param commentId - ID do comentário
     * @returns Lista de anexos
     */
    async getCommentAttachments(
        projectId: number,
        cardId: number,
        commentId: number
    ): Promise<CommentAttachmentListResponse> {
        const response = await api.get<CommentAttachmentListResponse>(
            `/api/projects/${projectId}/cards/${cardId}/comments/${commentId}/attachments`
        );
        return response.data;
    },

    /**
     * Faz download de um anexo
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param commentId - ID do comentário
     * @param attachmentId - ID do anexo
     */
    async downloadAttachment(
        projectId: number,
        cardId: number,
        commentId: number,
        attachmentId: number
    ): Promise<void> {
        // Primeiro buscar informações do anexo para pegar o filename
        const attachmentsResponse = await this.getCommentAttachments(projectId, cardId, commentId);
        const attachment = attachmentsResponse.attachments.find(a => a.id === attachmentId);
        const filename = attachment?.filename || `attachment_${attachmentId}`;

        // Fazer download do arquivo
        const response = await api.get(
            `/api/projects/${projectId}/cards/${cardId}/comments/${commentId}/attachments/${attachmentId}`,
            { responseType: 'blob' }
        );

        // Criar um link temporário e forçar download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Deleta um anexo
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param commentId - ID do comentário
     * @param attachmentId - ID do anexo
     */
    async deleteAttachment(
        projectId: number,
        cardId: number,
        commentId: number,
        attachmentId: number
    ): Promise<void> {
        await api.delete(
            `/api/projects/${projectId}/cards/${cardId}/comments/${commentId}/attachments/${attachmentId}`
        );
    },

    // Reutilizar funções utilitárias do attachmentService
    formatFileSize: attachmentService.formatFileSize,
    validateFile: attachmentService.validateFile,
    getFileIcon: attachmentService.getFileIcon,
};

export default commentAttachmentService;
