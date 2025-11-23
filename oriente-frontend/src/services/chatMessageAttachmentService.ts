import api from "./api";
import type { ChatMessageAttachment, ChatMessageAttachmentListResponse } from "../types/chat";
import attachmentService from "./attachmentService";

/**
 * Serviço para gerenciar anexos de mensagens de chat
 */
const chatMessageAttachmentService = {
    /**
     * Faz upload de um anexo para uma mensagem de chat
     * @param chatId - ID do chat
     * @param messageId - ID da mensagem
     * @param file - Arquivo a ser enviado
     * @returns Anexo criado
     */
    async uploadAttachment(
        chatId: number,
        messageId: number,
        file: File
    ): Promise<ChatMessageAttachment> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post<ChatMessageAttachment>(
            `/api/chats/${chatId}/messages/${messageId}/attachments`,
            formData
        );
        return response.data;
    },

    /**
     * Lista todos os anexos de uma mensagem de chat
     * @param chatId - ID do chat
     * @param messageId - ID da mensagem
     * @returns Lista de anexos
     */
    async getMessageAttachments(
        chatId: number,
        messageId: number
    ): Promise<ChatMessageAttachmentListResponse> {
        const response = await api.get<ChatMessageAttachmentListResponse>(
            `/api/chats/${chatId}/messages/${messageId}/attachments`
        );
        return response.data;
    },

    /**
     * Faz download de um anexo
     * @param chatId - ID do chat
     * @param messageId - ID da mensagem
     * @param attachmentId - ID do anexo
     */
    async downloadAttachment(
        chatId: number,
        messageId: number,
        attachmentId: number
    ): Promise<void> {
        // Primeiro buscar informações do anexo para pegar o filename
        const attachmentsResponse = await this.getMessageAttachments(chatId, messageId);
        const attachment = attachmentsResponse.attachments.find(a => a.id === attachmentId);
        const filename = attachment?.filename || `attachment_${attachmentId}`;

        // Fazer download do arquivo
        const response = await api.get(
            `/api/chats/${chatId}/messages/${messageId}/attachments/${attachmentId}`,
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
     * @param chatId - ID do chat
     * @param messageId - ID da mensagem
     * @param attachmentId - ID do anexo
     */
    async deleteAttachment(
        chatId: number,
        messageId: number,
        attachmentId: number
    ): Promise<void> {
        await api.delete(
            `/api/chats/${chatId}/messages/${messageId}/attachments/${attachmentId}`
        );
    },

    // Reutilizar funções utilitárias do attachmentService
    formatFileSize: attachmentService.formatFileSize,
    validateFile: attachmentService.validateFile,
    getFileIcon: attachmentService.getFileIcon,
};

export default chatMessageAttachmentService;
