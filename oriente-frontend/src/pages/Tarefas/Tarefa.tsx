import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Paper,
    Typography,
    Button,
    Chip,
    Avatar,
    AvatarGroup,
    Divider,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    Pagination,
    Menu,
    MenuItem,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
    ArrowBackOutlined,
    MoreVertOutlined,
    CalendarTodayOutlined,
    PersonOutlined,
    FlagOutlined,
    ChatBubbleOutlineOutlined,
    CheckCircleOutlineOutlined,
    SendOutlined,
    HistoryOutlined,
    EditOutlined,
    DeleteOutlined,
    AttachFileOutlined,
} from "@mui/icons-material";
import Opcoes from "../../components/Tarefas/Opcoes";
import EditTask from "../../components/Tarefas/EditTask";
import QuickAssigneeDialog from "../../components/Tarefas/QuickAssigneeDialog";
import QuickDateDialog from "../../components/Tarefas/QuickDateDialog";
import CommentInput from "../../components/Tarefas/CommentInput";
import AttachmentDialog from "../../components/Tarefas/AttachmentDialog";
import CommentAttachments from "../../components/Tarefas/CommentAttachments";
import cardService from "../../services/cardService";
import projectService from "../../services/projectService";
import attachmentService from "../../services/attachmentService";
import type { Card, Comment, CardHistory, CardHistoryAction, KanbanColumn, Attachment } from "../../types";

const getPrioridadeColor = (prioridade: Card["priority"]) => {
    switch (prioridade) {
        case "urgent":
            return "error";
        case "high":
            return "error";
        case "medium":
            return "warning";
        case "low":
            return "success";
        default:
            return "default";
    }
};

const getPrioridadeLabel = (prioridade: Card["priority"]) => {
    switch (prioridade) {
        case "urgent":
            return "Urgente";
        case "high":
            return "Alta";
        case "medium":
            return "Média";
        case "low":
            return "Baixa";
        default:
            return prioridade;
    }
};

const getHistoryActionLabel = (action: CardHistoryAction): string => {
    const labels: Record<CardHistoryAction, string> = {
        CREATED: "Criado",
        UPDATED: "Atualizado",
        MOVED: "Movido",
        COMMENT_ADDED: "Comentário adicionado",
        COMMENT_DELETED: "Comentário deletado",
        ASSIGNEE_ADDED: "Responsável adicionado",
        ASSIGNEE_REMOVED: "Responsável removido",
    };
    return labels[action] || action;
};

const getHistoryActionColor = (action: CardHistoryAction): string => {
    switch (action) {
        case "CREATED":
            return "#4caf50";
        case "UPDATED":
            return "#2196f3";
        case "MOVED":
            return "#ff9800";
        case "COMMENT_ADDED":
        case "COMMENT_DELETED":
            return "#9c27b0";
        case "ASSIGNEE_ADDED":
        case "ASSIGNEE_REMOVED":
            return "#00bcd4";
        default:
            return "#757575";
    }
};

/**
 * Renderizar comentário com menções coloridas
 * Encontra @username e colore com cor primária
 */
const renderCommentWithMentions = (content: string): ReactNode[] => {
    // Regex para encontrar @username (sem espaços)
    const mentionPattern = /@([\w.-]+)/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;

    const matches = content.matchAll(mentionPattern);

    for (const match of matches) {
        // Adicionar texto antes da menção
        if (match.index! > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
        }

        const fullMention = match[0]; // Inclui o @

        // Colorir a menção
        parts.push(
            <span key={`mention-${parts.length}`} style={{ color: "#1976d2", fontWeight: 500 }}>
                {fullMention}
            </span>
        );

        lastIndex = match.index! + fullMention.length;
    }

    // Adicionar texto restante
    if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
    }

    return parts;
};

export default function Tarefa() {
    const navigate = useNavigate();
    const { projectId, cardId } = useParams<{ projectId: string; cardId: string }>();

    // Estados para dados
    const [card, setCard] = useState<Card | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [history, setHistory] = useState<CardHistory[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // Estados de loading
    const [loadingCard, setLoadingCard] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [loadingAttachments, setLoadingAttachments] = useState(true);

    // Estados de UI
    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [commentMenuAnchorEl, setCommentMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingCommentText, setEditingCommentText] = useState("");
    const [dialogExcluir, setDialogExcluir] = useState(false);
    const [dialogArquivar, setDialogArquivar] = useState(false);
    const [dialogExcluirComentario, setDialogExcluirComentario] = useState(false);
    const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
    const [quickAssigneeDialogOpen, setQuickAssigneeDialogOpen] = useState(false);
    const [quickDateDialogOpen, setQuickDateDialogOpen] = useState(false);
    const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info"
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    // Carregar dados do card
    useEffect(() => {
        if (projectId && cardId) {
            loadCard();
            loadComments();
            loadHistory(1);
            loadColumns();
            loadAttachments();
        }
    }, [projectId, cardId]);

    const loadCard = async () => {
        try {
            setLoadingCard(true);
            const data = await cardService.getCard(Number(projectId), cardId!);
            setCard(data);
        } catch (error: any) {
            console.error("Erro ao carregar card:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao carregar dados do card",
                severity: "error",
            });
        } finally {
            setLoadingCard(false);
        }
    };

    const loadComments = async () => {
        try {
            setLoadingComments(true);
            const data = await cardService.getCardComments(Number(projectId), cardId!);
            setComments(data);
        } catch (error: any) {
            console.error("Erro ao carregar comentários:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao carregar comentários",
                severity: "error",
            });
        } finally {
            setLoadingComments(false);
        }
    };

    const loadHistory = async (page: number) => {
        try {
            setLoadingHistory(true);
            const data = await cardService.getCardHistory(Number(projectId), cardId!, page, 10);
            setHistory(data.history);
            setHistoryTotalPages(data.total_pages);
            setHistoryPage(page);
        } catch (error: any) {
            console.error("Erro ao carregar histórico:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao carregar histórico",
                severity: "error",
            });
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadColumns = async () => {
        try {
            const boardData = await projectService.getProjectBoard(Number(projectId));
            setColumns(boardData.board);
        } catch (error: any) {
            console.error("Erro ao carregar colunas:", error);
        }
    };

    const loadAttachments = async () => {
        try {
            setLoadingAttachments(true);
            const data = await attachmentService.getCardAttachments(Number(projectId), Number(cardId));
            setAttachments(data.attachments);
        } catch (error: any) {
            console.error("Erro ao carregar anexos:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao carregar anexos",
                severity: "error",
            });
        } finally {
            setLoadingAttachments(false);
        }
    };

    const handleVoltar = () => {
        navigate(`/projetos/${projectId}`);
    };

    const handleEnviarComentario = async (content: string) => {
        if (!content.trim()) return;

        try {
            setSubmittingComment(true);
            await cardService.createComment(Number(projectId), cardId!, content);
            setSnackbar({
                open: true,
                message: "Comentário adicionado com sucesso!",
                severity: "success",
            });
            // Recarregar comentários e histórico
            loadComments();
            loadHistory(1);
        } catch (error: any) {
            console.error("Erro ao criar comentário:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao criar comentário",
                severity: "error",
            });
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleEditarComentario = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditingCommentText(comment.content);
        setCommentMenuAnchorEl(null);
    };

    const handleSalvarEdicaoComentario = async (commentId: number) => {
        if (!editingCommentText.trim()) return;

        try {
            await cardService.updateComment(Number(projectId), cardId!, commentId, editingCommentText);
            setEditingCommentId(null);
            setEditingCommentText("");
            setSnackbar({
                open: true,
                message: "Comentário atualizado com sucesso!",
                severity: "success",
            });
            loadComments();
        } catch (error: any) {
            console.error("Erro ao atualizar comentário:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao atualizar comentário",
                severity: "error",
            });
        }
    };

    const handleCancelarEdicaoComentario = () => {
        setEditingCommentId(null);
        setEditingCommentText("");
    };

    const handleOpenCommentMenu = (event: React.MouseEvent<HTMLElement>, commentId: number) => {
        setCommentMenuAnchorEl(event.currentTarget);
        setSelectedCommentId(commentId);
    };

    const handleCloseCommentMenu = () => {
        setCommentMenuAnchorEl(null);
        setSelectedCommentId(null);
    };

    const handleConfirmarExcluirComentario = async () => {
        if (!selectedCommentId) return;

        try {
            await cardService.deleteComment(Number(projectId), cardId!, selectedCommentId);
            setDialogExcluirComentario(false);
            setSelectedCommentId(null);
            setSnackbar({
                open: true,
                message: "Comentário excluído com sucesso!",
                severity: "success",
            });
            loadComments();
            loadHistory(1);
        } catch (error: any) {
            console.error("Erro ao excluir comentário:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao excluir comentário",
                severity: "error",
            });
        }
    };

    const handleAbrirMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleFecharMenu = () => {
        setMenuAnchorEl(null);
    };

    const handleEditar = () => {
        setMenuAnchorEl(null);
        setTimeout(() => {
            setEditTaskDialogOpen(true);
        }, 100);
    };

    const handleSaveEdit = async (data: {
        title: string;
        description: string;
        priority: Card["priority"];
        assignee_ids: number[];
        due_date?: string;
    }) => {
        try {
            await cardService.updateCard(Number(projectId), cardId!, data);
            setEditTaskDialogOpen(false);
            await loadCard(); // Reload card to get updated data
            await loadHistory(1); // Reload history to show the update
            setSnackbar({
                open: true,
                message: "Tarefa atualizada com sucesso!",
                severity: "success",
            });
        } catch (error: any) {
            let errorMessage = "Erro ao atualizar tarefa";
            if (error.response?.data?.detail) {
                errorMessage = typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : "Erro ao atualizar tarefa";
            }
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error",
            });
        }
    };

    const handleDuplicar = async () => {
        if (!card) return;

        try {
            await projectService.createCard(Number(projectId), {
                title: `${card.title} (Cópia)`,
                description: card.description,
                priority: card.priority,
                column_id: card.column_id,
                due_date: card.due_date,
                assignee_ids: card.assignees.map((a) => a.id),
            });
            setSnackbar({
                open: true,
                message: "Tarefa duplicada com sucesso!",
                severity: "success",
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao duplicar tarefa",
                severity: "error",
            });
        }
    };

    const handleArquivar = () => {
        setDialogArquivar(true);
    };

    const handleConfirmarArquivar = async () => {
        try {
            await cardService.updateCardStatus(Number(projectId), cardId!, "archived");
            setDialogArquivar(false);
            setSnackbar({
                open: true,
                message: "Tarefa arquivada com sucesso!",
                severity: "success",
            });
            setTimeout(() => {
                navigate(`/projetos/${projectId}`);
            }, 1500);
        } catch (error: any) {
            setDialogArquivar(false);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao arquivar tarefa",
                severity: "error",
            });
        }
    };

    const handleAdicionarResponsavel = () => {
        // Close menu first, then open quick assignee dialog
        setMenuAnchorEl(null);
        setTimeout(() => {
            setQuickAssigneeDialogOpen(true);
        }, 100);
    };

    const handleAlterarData = () => {
        // Close menu first, then open quick date dialog
        setMenuAnchorEl(null);
        setTimeout(() => {
            setQuickDateDialogOpen(true);
        }, 100);
    };

    const handleQuickAssignee = async (userId: number) => {
        if (!card) return;

        try {
            await cardService.updateCard(Number(projectId), cardId!, {
                assignee_ids: [userId],
            });
            setQuickAssigneeDialogOpen(false);
            await loadCard();
            setSnackbar({
                open: true,
                message: "Responsável atribuído com sucesso!",
                severity: "success",
            });
        } catch (error: any) {
            let errorMessage = "Erro ao atribuir responsável";
            if (error.response?.data?.detail) {
                errorMessage = typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : "Erro ao atribuir responsável";
            }
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error",
            });
        }
    };

    const handleQuickDate = async (date: string) => {
        if (!card) return;

        try {
            // Convert YYYY-MM-DD to ISO format with time
            const isoDate = new Date(date + "T00:00:00Z").toISOString();

            await cardService.updateCard(Number(projectId), cardId!, {
                due_date: isoDate,
                title: card.title,
                description: card.description,
                priority: card.priority,
                assignee_ids: card.assignees.map((a) => a.id),
            });
            setQuickDateDialogOpen(false);
            await loadCard();
            setSnackbar({
                open: true,
                message: "Data alterada com sucesso!",
                severity: "success",
            });
        } catch (error: any) {
            let errorMessage = "Erro ao alterar data";
            if (error.response?.data?.detail) {
                errorMessage = typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : "Erro ao alterar data";
            }
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error",
            });
        }
    };

    const handleExcluir = () => {
        setDialogExcluir(true);
    };

    const handleConfirmarExcluir = async () => {
        try {
            await cardService.deleteCard(Number(projectId), cardId!);
            setDialogExcluir(false);
            setSnackbar({
                open: true,
                message: "Tarefa excluída com sucesso!",
                severity: "success",
            });
            setTimeout(() => {
                navigate(`/projetos/${projectId}`);
            }, 1500);
        } catch (error: any) {
            setDialogExcluir(false);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao excluir tarefa",
                severity: "error",
            });
        }
    };

    const handleMoverParaColuna = async (columnId: number) => {
        if (!card) return;

        try {
            // Calculate new position (add at the end of target column)
            const targetColumn = columns.find((col) => col.id === columnId);
            const newPosition = targetColumn ? targetColumn.cards.length : 0;

            await projectService.moveCard(Number(projectId), card.id, {
                column_id: columnId,
                new_position: newPosition,
            });

            await loadCard(); // Reload card to show new column
            await loadHistory(1); // Reload history to show the move

            setSnackbar({
                open: true,
                message: "Tarefa movida com sucesso!",
                severity: "success",
            });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao mover tarefa",
                severity: "error",
            });
        }
    };

    const handleHistoryPageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        loadHistory(value);
    };

    if (loadingCard) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!card) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center", mt: 5 }}>
                <Typography variant="h5">Card não encontrado</Typography>
                <Button variant="contained" onClick={handleVoltar}>
                    Voltar para Projetos
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Button
                        startIcon={<ArrowBackOutlined />}
                        onClick={handleVoltar}
                        variant="outlined"
                        size="small"
                    >
                        Voltar
                    </Button>
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {card.title}
                            </Typography>
                            <Chip
                                label={getPrioridadeLabel(card.priority)}
                                color={getPrioridadeColor(card.priority)}
                                size="small"
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Criado em {new Date(card.created_at).toLocaleDateString("pt-BR")}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleAbrirMenu}>
                    <MoreVertOutlined />
                </IconButton>
                <Opcoes
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleFecharMenu}
                    onEditar={handleEditar}
                    onDuplicar={handleDuplicar}
                    onArquivar={handleArquivar}
                    onAdicionarResponsavel={handleAdicionarResponsavel}
                    onAlterarData={handleAlterarData}
                    onExcluir={handleExcluir}
                    onMoverParaColuna={handleMoverParaColuna}
                    columns={columns}
                    currentColumnId={card.column_id}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Coluna Principal */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* Descrição */}
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Descrição
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: "text.secondary",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.8,
                            }}
                        >
                            {card.description || "Sem descrição"}
                        </Typography>
                    </Paper>

                    {/* Anexos */}
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <AttachFileOutlined fontSize="small" />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Anexos ({attachments.length})
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AttachFileOutlined />}
                                onClick={() => setAttachmentDialogOpen(true)}
                            >
                                Gerenciar Anexos
                            </Button>
                        </Box>
                        {loadingAttachments ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : attachments.length === 0 ? (
                            <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                                Nenhum anexo ainda. Clique em "Gerenciar Anexos" para adicionar arquivos.
                            </Typography>
                        ) : (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {attachments.map((attachment) => (
                                    <Chip
                                        key={attachment.id}
                                        label={attachment.filename}
                                        size="small"
                                        icon={<AttachFileOutlined />}
                                        onClick={() => {
                                            attachmentService.downloadAttachment(
                                                Number(projectId),
                                                Number(cardId),
                                                attachment.id
                                            );
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Paper>

                    {/* Comentários */}
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                            <ChatBubbleOutlineOutlined fontSize="small" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Comentários ({comments.length})
                            </Typography>
                        </Box>

                        {loadingComments ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ mb: 3 }}>
                                    {comments.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                                            Nenhum comentário ainda. Seja o primeiro a comentar!
                                        </Typography>
                                    ) : (
                                        comments.map((comment) => (
                                            <Box key={comment.id} sx={{ mb: 3 }}>
                                                <Box sx={{ display: "flex", gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: "primary.main" }}>
                                                        {comment.user.name.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                {comment.user.name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                                {new Date(comment.created_at).toLocaleString("pt-BR")}
                                                            </Typography>
                                                            {(comment.can_edit || comment.can_delete) && (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => handleOpenCommentMenu(e, comment.id)}
                                                                    sx={{ ml: "auto" }}
                                                                >
                                                                    <MoreVertOutlined fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                        {editingCommentId === comment.id ? (
                                                            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                                                <TextField
                                                                    fullWidth
                                                                    multiline
                                                                    rows={2}
                                                                    value={editingCommentText}
                                                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                                                    size="small"
                                                                />
                                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => handleSalvarEdicaoComentario(comment.id)}
                                                                        disabled={!editingCommentText.trim()}
                                                                    >
                                                                        <SendOutlined fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={handleCancelarEdicaoComentario}
                                                                    >
                                                                        <DeleteOutlined fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Box>
                                                        ) : (
                                                            <>
                                                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                                    {renderCommentWithMentions(comment.content)}
                                                                </Typography>
                                                                <CommentAttachments
                                                                    projectId={Number(projectId)}
                                                                    cardId={Number(cardId)}
                                                                    commentId={comment.id}
                                                                    attachments={comment.attachments || []}
                                                                    canEdit={comment.can_edit}
                                                                    onAttachmentsChange={(newAttachments) => {
                                                                        setComments(comments.map(c =>
                                                                            c.id === comment.id
                                                                                ? { ...c, attachments: newAttachments }
                                                                                : c
                                                                        ));
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ))
                                    )}
                                </Box>

                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ display: "flex", gap: 2 }}>
                                    <Avatar sx={{ bgcolor: "primary.main" }}>U</Avatar>
                                    <CommentInput
                                        onSubmit={handleEnviarComentario}
                                        disabled={submittingComment}
                                        projectId={Number(projectId)}
                                        placeholder="Escrever um comentário... (use @nome para mencionar)"
                                    />
                                </Box>
                            </>
                        )}
                    </Paper>

                    {/* Histórico de Auditoria */}
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                            <HistoryOutlined fontSize="small" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Histórico de Auditoria
                            </Typography>
                        </Box>

                        {loadingHistory ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : (
                            <>
                                {history.length === 0 ? (
                                    <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
                                        Nenhum histórico disponível.
                                    </Typography>
                                ) : (
                                    <List>
                                        {history.map((item) => (
                                            <ListItem
                                                key={item.id}
                                                sx={{
                                                    bgcolor: "background.paper",
                                                    borderRadius: 1.5,
                                                    mb: 1,
                                                    borderLeft: 4,
                                                    borderColor: getHistoryActionColor(item.action),
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: getHistoryActionColor(item.action),
                                                            width: 32,
                                                            height: 32,
                                                        }}
                                                    >
                                                        {item.user.name.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {item.user.name}
                                                            </Typography>
                                                            <Chip
                                                                label={getHistoryActionLabel(item.action)}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: "0.7rem",
                                                                    bgcolor: getHistoryActionColor(item.action),
                                                                    color: "white",
                                                                }}
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2" sx={{ color: "text.primary", mt: 0.5 }}>
                                                                {item.message}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                                {new Date(item.created_at).toLocaleString("pt-BR")}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}

                                {historyTotalPages > 1 && (
                                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                                        <Pagination
                                            count={historyTotalPages}
                                            page={historyPage}
                                            onChange={handleHistoryPageChange}
                                            color="primary"
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Paper>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, position: "sticky", top: 24 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Detalhes
                        </Typography>

                        {/* Status */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <CheckCircleOutlineOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                    STATUS
                                </Typography>
                            </Box>
                            <Chip label={card.status} color="primary" />
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Prioridade */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <FlagOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                    PRIORIDADE
                                </Typography>
                            </Box>
                            <Chip
                                label={getPrioridadeLabel(card.priority)}
                                color={getPrioridadeColor(card.priority)}
                            />
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Responsáveis */}
                        {card.assignees && card.assignees.length > 0 && (
                            <>
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <PersonOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                            RESPONSÁVEIS
                                        </Typography>
                                    </Box>
                                    <AvatarGroup max={4}>
                                        {card.assignees.map((assignee) => (
                                            <Avatar
                                                key={assignee.id}
                                                sx={{ bgcolor: "primary.main" }}
                                                title={assignee.name}
                                            >
                                                {assignee.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                        ))}
                                    </AvatarGroup>
                                    <Box sx={{ mt: 1 }}>
                                        {card.assignees.map((assignee) => (
                                            <Typography
                                                key={assignee.id}
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                {assignee.name}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 3 }} />
                            </>
                        )}

                        {/* Data Limite */}
                        {card.due_date && (
                            <>
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <CalendarTodayOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                            DATA LIMITE
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {new Date(card.due_date).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </Typography>
                                </Box>

                                <Divider sx={{ mb: 3 }} />
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Menu de opções do comentário */}
            <Menu
                anchorEl={commentMenuAnchorEl}
                open={Boolean(commentMenuAnchorEl)}
                onClose={handleCloseCommentMenu}
            >
                {comments.find(c => c.id === selectedCommentId)?.can_edit && (
                    <MenuItem onClick={() => {
                        const comment = comments.find(c => c.id === selectedCommentId);
                        if (comment) handleEditarComentario(comment);
                    }}>
                        <EditOutlined fontSize="small" sx={{ mr: 1 }} />
                        Editar
                    </MenuItem>
                )}
                {comments.find(c => c.id === selectedCommentId)?.can_delete && (
                    <MenuItem
                        onClick={() => {
                            setDialogExcluirComentario(true);
                            handleCloseCommentMenu();
                        }}
                        sx={{ color: "error.main" }}
                    >
                        <DeleteOutlined fontSize="small" sx={{ mr: 1 }} />
                        Excluir
                    </MenuItem>
                )}
            </Menu>

            {/* Dialog Excluir Comentário */}
            <Dialog
                open={dialogExcluirComentario}
                onClose={() => setDialogExcluirComentario(false)}
                PaperProps={{
                    sx: { borderRadius: 2 },
                }}
            >
                <DialogTitle>Excluir comentário?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogExcluirComentario(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmarExcluirComentario} variant="contained" color="error">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Excluir */}
            <Dialog
                open={dialogExcluir}
                onClose={() => setDialogExcluir(false)}
                PaperProps={{
                    sx: { borderRadius: 2 },
                }}
            >
                <DialogTitle>Excluir tarefa?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir a tarefa "<strong>{card.title}</strong>"?
                        Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogExcluir(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmarExcluir} variant="contained" color="error">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Arquivar */}
            <Dialog
                open={dialogArquivar}
                onClose={() => setDialogArquivar(false)}
                PaperProps={{
                    sx: { borderRadius: 2 },
                }}
            >
                <DialogTitle>Arquivar tarefa?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Deseja arquivar a tarefa "<strong>{card.title}</strong>"?
                        Você poderá restaurá-la posteriormente.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDialogArquivar(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmarArquivar} variant="contained">
                        Arquivar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Task Dialog */}
            {card && (
                <EditTask
                    open={editTaskDialogOpen}
                    onClose={() => setEditTaskDialogOpen(false)}
                    onSave={handleSaveEdit}
                    card={card}
                />
            )}

            {/* Quick Assignee Dialog */}
            {card && (
                <QuickAssigneeDialog
                    open={quickAssigneeDialogOpen}
                    onClose={() => setQuickAssigneeDialogOpen(false)}
                    onSave={handleQuickAssignee}
                    currentAssigneeId={card.assignees[0]?.id}
                />
            )}

            {/* Quick Date Dialog */}
            {card && (
                <QuickDateDialog
                    open={quickDateDialogOpen}
                    onClose={() => setQuickDateDialogOpen(false)}
                    onSave={handleQuickDate}
                    currentDate={card.due_date}
                />
            )}

            {/* Attachment Dialog */}
            <AttachmentDialog
                open={attachmentDialogOpen}
                onClose={() => setAttachmentDialogOpen(false)}
                projectId={Number(projectId)}
                cardId={Number(cardId)}
                attachments={attachments}
                onUploadSuccess={(newAttachment) => {
                    setAttachments([...attachments, newAttachment]);
                }}
                onDelete={(attachmentId) => {
                    setAttachments(attachments.filter((a) => a.id !== attachmentId));
                }}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
