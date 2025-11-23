import { useState } from "react";
import {
    Box,
    Chip,
    Alert,
} from "@mui/material";
import {
    AttachFile,
    Close,
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
    const [error, setError] = useState<string | null>(null);

    console.log(`📎 CommentAttachments renderizado - Comment ${commentId}, ${attachments.length} anexos:`, attachments);

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

    // Não renderizar nada se não houver anexos
    if (attachments.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 1 }}>
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
