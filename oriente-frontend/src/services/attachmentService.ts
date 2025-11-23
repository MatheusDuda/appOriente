import api from "./api";
import type { Attachment, AttachmentListResponse, ProjectStorageInfo } from "../types";

/**
 * Serviço para gerenciar anexos de cards
 */
const attachmentService = {
    /**
     * Faz upload de um anexo para um card
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param file - Arquivo a ser enviado
     * @returns Anexo criado
     */
    async uploadAttachment(
        projectId: number,
        cardId: number,
        file: File
    ): Promise<Attachment> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post<Attachment>(
            `/api/projects/${projectId}/cards/${cardId}/attachments`,
            formData
        );
        return response.data;
    },

    /**
     * Lista todos os anexos de um card
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @returns Lista de anexos
     */
    async getCardAttachments(
        projectId: number,
        cardId: number
    ): Promise<AttachmentListResponse> {
        const response = await api.get<AttachmentListResponse>(
            `/api/projects/${projectId}/cards/${cardId}/attachments`
        );
        return response.data;
    },

    /**
     * Faz download de um anexo
     * @param projectId - ID do projeto
     * @param cardId - ID do card
     * @param attachmentId - ID do anexo
     */
    async downloadAttachment(
        projectId: number,
        cardId: number,
        attachmentId: number
    ): Promise<void> {
        // Primeiro buscar informações do anexo para pegar o filename
        const attachmentsResponse = await this.getCardAttachments(projectId, cardId);
        const attachment = attachmentsResponse.attachments.find(a => a.id === attachmentId);
        const filename = attachment?.filename || `attachment_${attachmentId}`;

        // Fazer download do arquivo
        const response = await api.get(
            `/api/projects/${projectId}/cards/${cardId}/attachments/${attachmentId}`,
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
     * @param attachmentId - ID do anexo
     */
    async deleteAttachment(
        projectId: number,
        cardId: number,
        attachmentId: number
    ): Promise<void> {
        await api.delete(
            `/api/projects/${projectId}/cards/${cardId}/attachments/${attachmentId}`
        );
    },

    /**
     * Obtém informações de armazenamento do projeto
     * @param projectId - ID do projeto
     * @returns Informações de storage
     */
    async getProjectStorage(projectId: number): Promise<ProjectStorageInfo> {
        const response = await api.get<ProjectStorageInfo>(
            `/api/projects/${projectId}/storage`
        );
        return response.data;
    },

    /**
     * Formata o tamanho do arquivo para exibição
     * @param bytes - Tamanho em bytes
     * @returns Tamanho formatado (ex: "1.5 MB")
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    },

    /**
     * Valida se o arquivo pode ser enviado
     * @param file - Arquivo a ser validado
     * @param maxSize - Tamanho máximo em bytes (padrão: 10MB)
     * @param allowedExtensions - Extensões permitidas
     * @returns Objeto com validação
     */
    validateFile(
        file: File,
        maxSize: number = 10485760, // 10MB
        allowedExtensions: string[] = [
            "pdf",
            "jpg",
            "jpeg",
            "png",
            "gif",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "txt",
            "zip",
        ]
    ): { valid: boolean; error?: string } {
        // Valida tamanho
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(maxSize)}`,
            };
        }

        // Valida extensão
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (!extension || !allowedExtensions.includes(extension)) {
            return {
                valid: false,
                error: `Tipo de arquivo não permitido. Extensões aceitas: ${allowedExtensions.join(", ")}`,
            };
        }

        return { valid: true };
    },

    /**
     * Obtém ícone do Material-UI baseado no tipo de arquivo
     * @param mimeType - Tipo MIME do arquivo
     * @returns Nome do ícone do MUI
     */
    getFileIcon(mimeType: string): string {
        if (mimeType.startsWith("image/")) return "Image";
        if (mimeType.includes("pdf")) return "PictureAsPdf";
        if (mimeType.includes("word") || mimeType.includes("document"))
            return "Description";
        if (
            mimeType.includes("sheet") ||
            mimeType.includes("excel") ||
            mimeType.includes("spreadsheet")
        )
            return "TableChart";
        if (mimeType.includes("zip") || mimeType.includes("compressed"))
            return "FolderZip";
        if (mimeType.startsWith("text/")) return "Article";
        return "AttachFile";
    },
};

export default attachmentService;
