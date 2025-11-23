import { useState, useRef } from "react";
import {
    Box,
    Button,
    Typography,
    IconButton,
    LinearProgress,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
} from "@mui/material";
import {
    CloudUpload,
    Close,
    InsertDriveFile,
} from "@mui/icons-material";
import attachmentService from "../../services/attachmentService";
import type { Attachment } from "../../types";

type AttachmentUploadProps = {
    projectId: number;
    cardId: number;
    currentAttachmentCount: number;
    maxAttachments?: number;
    onUploadSuccess: (attachment: Attachment) => void;
    onUploadError?: (error: string) => void;
};

export default function AttachmentUpload({
    projectId,
    cardId,
    currentAttachmentCount,
    maxAttachments = 5,
    onUploadSuccess,
    onUploadError,
}: AttachmentUploadProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        addFiles(Array.from(files));
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const files = event.dataTransfer.files;
        if (!files || files.length === 0) return;

        addFiles(Array.from(files));
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const addFiles = (files: File[]) => {
        setError(null);

        // Verifica limite de anexos
        const remainingSlots = maxAttachments - currentAttachmentCount - selectedFiles.length;
        if (remainingSlots <= 0) {
            setError(`Limite de ${maxAttachments} anexos atingido`);
            return;
        }

        const filesToAdd = files.slice(0, remainingSlots);
        const validFiles: File[] = [];
        const errors: string[] = [];

        for (const file of filesToAdd) {
            const validation = attachmentService.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }

        if (errors.length > 0) {
            setError(errors.join("; "));
        }

        if (validFiles.length > 0) {
            setSelectedFiles((prev) => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setError(null);
    };

    const handleUploadAll = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        const totalFiles = selectedFiles.length;
        let uploadedCount = 0;
        const errors: string[] = [];

        for (const file of selectedFiles) {
            try {
                const attachment = await attachmentService.uploadAttachment(
                    projectId,
                    cardId,
                    file
                );
                onUploadSuccess(attachment);
                uploadedCount++;
                setUploadProgress((uploadedCount / totalFiles) * 100);
            } catch (error: any) {
                const errorMsg = error.response?.data?.detail || error.message || "Erro desconhecido";
                errors.push(`${file.name}: ${errorMsg}`);
            }
        }

        setUploading(false);

        if (errors.length > 0) {
            const errorMessage = errors.join("; ");
            setError(errorMessage);
            onUploadError?.(errorMessage);
        } else {
            setSelectedFiles([]);
            setUploadProgress(0);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const canAddMore = currentAttachmentCount + selectedFiles.length < maxAttachments;

    return (
        <Box sx={{ width: "100%" }}>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt,.zip"
            />

            {/* Área de Upload */}
            <Paper
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                sx={{
                    p: 3,
                    border: "2px dashed",
                    borderColor: "divider",
                    backgroundColor: "action.hover",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.selected",
                    },
                }}
                onClick={handleButtonClick}
            >
                <CloudUpload sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    Arraste arquivos aqui ou clique para selecionar
                </Typography>
                <Typography variant="caption" color="text.disabled">
                    Máximo: 10 MB por arquivo | {maxAttachments - currentAttachmentCount} anexos disponíveis
                </Typography>
            </Paper>

            {/* Lista de Arquivos Selecionados */}
            {selectedFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Arquivos selecionados ({selectedFiles.length})
                    </Typography>
                    <List dense sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
                        {selectedFiles.map((file, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    <InsertDriveFile />
                                </ListItemIcon>
                                <ListItemText
                                    primary={file.name}
                                    secondary={attachmentService.formatFileSize(file.size)}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => removeFile(index)}
                                        disabled={uploading}
                                    >
                                        <Close />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>

                    {/* Barra de Progresso */}
                    {uploading && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                Enviando... {Math.round(uploadProgress)}%
                            </Typography>
                        </Box>
                    )}

                    {/* Botão de Upload */}
                    <Button
                        variant="contained"
                        onClick={handleUploadAll}
                        disabled={uploading || selectedFiles.length === 0}
                        startIcon={<CloudUpload />}
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        {uploading ? "Enviando..." : `Enviar ${selectedFiles.length} arquivo(s)`}
                    </Button>
                </Box>
            )}

            {/* Mensagens de Erro */}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Aviso de Limite */}
            {!canAddMore && selectedFiles.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    Limite de {maxAttachments} anexos atingido para esta tarefa
                </Alert>
            )}
        </Box>
    );
}
