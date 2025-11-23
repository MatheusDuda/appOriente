import { useState, useRef } from "react";
import {
    Box,
    IconButton,
    Chip,
    Tooltip,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    AttachFile,
    Close,
    CloudUpload,
} from "@mui/icons-material";
import commentAttachmentService from "../../services/commentAttachmentService";
import type { CommentAttachment } from "../../types";

type CommentAttachmentsProps = {
    projectId: number;
    cardId: number;
    commentId: number;
    attachments: CommentAttachment[];
    canEdit: boolean;
    onAttachmentsChange: (attachments: CommentAttachment[]) => void;
};

export default function CommentAttachments({
    projectId,
    cardId,
    commentId,
    attachments,
    canEdit,
    onAttachmentsChange,
}: CommentAttachmentsProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar arquivo
        const validation = commentAttachmentService.validateFile(file);
        if (!validation.valid) {
            setError(validation.error || "Arquivo inválido");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const newAttachment = await commentAttachmentService.uploadAttachment(
                projectId,
                cardId,
                commentId,
                file
            );
            onAttachmentsChange([...attachments, newAttachment]);
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message || "Erro ao fazer upload";
            setError(errorMsg);
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDelete = async (attachmentId: number) => {
        try {
            await commentAttachmentService.deleteAttachment(
                projectId,
                cardId,
                commentId,
                attachmentId
            );
            onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
        } catch (error: any) {
            setError(error.response?.data?.detail || "Erro ao deletar anexo");
        }
    };

    const handleDownload = async (attachmentId: number) => {
        try {
            await commentAttachmentService.downloadAttachment(
                projectId,
                cardId,
                commentId,
                attachmentId
            );
        } catch (error: any) {
            setError(error.response?.data?.detail || "Erro ao baixar anexo");
        }
    };

    return (
        <Box sx={{ mt: 1 }}>
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt,.zip"
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {/* Anexos existentes */}
                {attachments.map((attachment) => (
                    <Chip
                        key={attachment.id}
                        label={attachment.filename}
                        size="small"
                        icon={<AttachFile fontSize="small" />}
                        onClick={() => handleDownload(attachment.id)}
                        onDelete={canEdit ? () => handleDelete(attachment.id) : undefined}
                        deleteIcon={<Close fontSize="small" />}
                        sx={{
                            maxWidth: 200,
                            cursor: "pointer",
                            "&:hover": {
                                backgroundColor: "action.selected",
                            }
                        }}
                    />
                ))}

                {/* Botão de upload */}
                {canEdit && (
                    <Tooltip title="Adicionar anexo">
                        <IconButton
                            size="small"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            sx={{
                                width: 28,
                                height: 28,
                                border: "1px dashed",
                                borderColor: "divider",
                            }}
                        >
                            {uploading ? (
                                <CircularProgress size={16} />
                            ) : (
                                <CloudUpload fontSize="small" />
                            )}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Erro */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mt: 1 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}
        </Box>
    );
}
