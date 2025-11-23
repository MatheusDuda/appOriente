import { useState } from "react";
import {
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Tooltip,
    Chip,
    Paper,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    Download,
    Delete,
    Image,
    PictureAsPdf,
    Description,
    TableChart,
    FolderZip,
    Article,
    AttachFile,
} from "@mui/icons-material";
import attachmentService from "../../services/attachmentService";
import type { Attachment } from "../../types";

type AttachmentListProps = {
    projectId: number;
    cardId: number;
    attachments: Attachment[];
    loading?: boolean;
    onDelete?: (attachmentId: number) => void;
    canDelete?: boolean;
};

export default function AttachmentList({
    projectId,
    cardId,
    attachments,
    loading = false,
    onDelete,
    canDelete = true,
}: AttachmentListProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) return <Image color="primary" />;
        if (mimeType.includes("pdf")) return <PictureAsPdf color="error" />;
        if (mimeType.includes("word") || mimeType.includes("document"))
            return <Description color="info" />;
        if (
            mimeType.includes("sheet") ||
            mimeType.includes("excel") ||
            mimeType.includes("spreadsheet")
        )
            return <TableChart color="success" />;
        if (mimeType.includes("zip") || mimeType.includes("compressed"))
            return <FolderZip color="warning" />;
        if (mimeType.startsWith("text/")) return <Article />;
        return <AttachFile />;
    };

    const handleDownload = async (attachment: Attachment) => {
        try {
            await attachmentService.downloadAttachment(
                projectId,
                cardId,
                attachment.id
            );
        } catch (error: any) {
            console.error("Erro ao baixar anexo:", error);
            setError(error.response?.data?.detail || "Erro ao baixar arquivo");
        }
    };

    const handleDeleteClick = (attachment: Attachment) => {
        setSelectedAttachment(attachment);
        setDeleteDialogOpen(true);
        setError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedAttachment) return;

        setDeleting(true);
        setError(null);

        try {
            await attachmentService.deleteAttachment(
                projectId,
                cardId,
                selectedAttachment.id
            );
            onDelete?.(selectedAttachment.id);
            setDeleteDialogOpen(false);
            setSelectedAttachment(null);
        } catch (error: any) {
            console.error("Erro ao deletar anexo:", error);
            setError(error.response?.data?.detail || "Erro ao deletar arquivo");
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSelectedAttachment(null);
        setError(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (attachments.length === 0) {
        return (
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                <AttachFile sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                    Nenhum anexo adicionado
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <List sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
                {attachments.map((attachment) => (
                    <ListItem
                        key={attachment.id}
                        sx={{
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-child": { borderBottom: "none" },
                        }}
                    >
                        <ListItemIcon>{getFileIcon(attachment.mime_type)}</ListItemIcon>
                        <ListItemText
                            primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" noWrap>
                                        {attachment.filename}
                                    </Typography>
                                    <Chip
                                        label={attachmentService.formatFileSize(attachment.file_size)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                            }
                            secondary={
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Enviado em {formatDate(attachment.created_at)}
                                    </Typography>
                                    {attachment.uploaded_by && (
                                        <Typography variant="caption" color="text.secondary">
                                            por {attachment.uploaded_by.name}
                                        </Typography>
                                    )}
                                </Box>
                            }
                        />
                        <ListItemSecondaryAction>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Baixar">
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => handleDownload(attachment)}
                                    >
                                        <Download />
                                    </IconButton>
                                </Tooltip>
                                {canDelete && (
                                    <Tooltip title="Deletar">
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleDeleteClick(attachment)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Deletar Anexo</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja deletar o arquivo{" "}
                        <strong>{selectedAttachment?.filename}</strong>? Esta ação não pode ser
                        desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} disabled={deleting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
                    >
                        {deleting ? "Deletando..." : "Deletar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
