import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Divider,
    IconButton,
} from "@mui/material";
import { Close, AttachFile } from "@mui/icons-material";
import AttachmentList from "./AttachmentList";
import AttachmentUpload from "./AttachmentUpload";
import type { Attachment } from "../../types";

type AttachmentDialogProps = {
    open: boolean;
    onClose: () => void;
    projectId: number;
    cardId: number;
    attachments: Attachment[];
    loading?: boolean;
    onUploadSuccess: (attachment: Attachment) => void;
    onUploadError?: (error: string) => void;
    onDelete: (attachmentId: number) => void;
    maxAttachments?: number;
};

export default function AttachmentDialog({
    open,
    onClose,
    projectId,
    cardId,
    attachments,
    loading = false,
    onUploadSuccess,
    onUploadError,
    onDelete,
    maxAttachments = 5,
}: AttachmentDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 },
            }}
        >
            <DialogTitle>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AttachFile />
                        <Typography variant="h6">
                            Anexos ({attachments.length}/{maxAttachments})
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* Lista de Anexos */}
                    {attachments.length > 0 && (
                        <>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                                    Anexos existentes
                                </Typography>
                                <AttachmentList
                                    projectId={projectId}
                                    cardId={cardId}
                                    attachments={attachments}
                                    loading={loading}
                                    onDelete={onDelete}
                                    canDelete={true}
                                />
                            </Box>
                            <Divider />
                        </>
                    )}

                    {/* Upload de Anexos */}
                    {attachments.length < maxAttachments ? (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                                Adicionar anexo
                            </Typography>
                            <AttachmentUpload
                                projectId={projectId}
                                cardId={cardId}
                                currentAttachmentCount={attachments.length}
                                maxAttachments={maxAttachments}
                                onUploadSuccess={onUploadSuccess}
                                onUploadError={onUploadError}
                            />
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: "center", py: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Limite de {maxAttachments} anexos atingido
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
