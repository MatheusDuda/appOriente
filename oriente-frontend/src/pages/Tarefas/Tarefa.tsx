import { useState } from "react";
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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
    ArrowBackOutlined,
    MoreVertOutlined,
    CalendarTodayOutlined,
    PersonOutlined,
    FlagOutlined,
    AttachFileOutlined,
    ChatBubbleOutlineOutlined,
    CheckCircleOutlineOutlined,
    SendOutlined,
} from "@mui/icons-material";
import Opcoes from "../../components/Tarefas/Opcoes";

type Comentario = {
    id: number;
    autor: string;
    avatar?: string;
    texto: string;
    data: string;
};

type Anexo = {
    id: number;
    nome: string;
    tipo: string;
    tamanho: string;
    data: string;
};

type Tarefa = {
    id: string;
    titulo: string;
    descricao: string;
    prioridade: "Alta" | "Média" | "Baixa";
    status: string;
    responsaveis: { id: number; nome: string; avatar?: string }[];
    dataLimite?: string;
    dataCriacao: string;
    tags: string[];
    projeto: string;
    comentarios: Comentario[];
    anexos: Anexo[];
};

const mockTarefa: Tarefa = {
    id: "task-1",
    titulo: "Implementar autenticação JWT",
    descricao: `Criar sistema completo de autenticação utilizando JSON Web Tokens (JWT).

Requisitos:
- Endpoint de login
- Endpoint de registro
- Endpoint de refresh token
- Middleware de autenticação
- Validação de tokens
- Tratamento de erros

A implementação deve seguir as melhores práticas de segurança e incluir testes unitários.`,
    prioridade: "Alta",
    status: "Em Progresso",
    responsaveis: [
        { id: 1, nome: "João Silva" },
        { id: 2, nome: "Maria Santos" },
    ],
    dataLimite: "2025-10-15",
    dataCriacao: "2025-10-01",
    tags: ["Backend", "Segurança", "API"],
    projeto: "Projeto Alpha",
    comentarios: [
        {
            id: 1,
            autor: "João Silva",
            texto: "Já iniciei a implementação do endpoint de login. Deve estar pronto até amanhã.",
            data: "2025-10-05 14:30",
        },
        {
            id: 2,
            autor: "Maria Santos",
            texto: "Ótimo! Vou trabalhar nos testes unitários enquanto isso.",
            data: "2025-10-05 15:45",
        },
    ],
    anexos: [
        {
            id: 1,
            nome: "auth-diagram.png",
            tipo: "image/png",
            tamanho: "245 KB",
            data: "2025-10-02",
        },
        {
            id: 2,
            nome: "jwt-requirements.pdf",
            tipo: "application/pdf",
            tamanho: "1.2 MB",
            data: "2025-10-01",
        },
    ],
};

const getPrioridadeColor = (prioridade: Tarefa["prioridade"]) => {
    switch (prioridade) {
        case "Alta":
            return "error";
        case "Média":
            return "warning";
        case "Baixa":
            return "success";
        default:
            return "default";
    }
};

export default function Tarefa() {
    const navigate = useNavigate();
    const { id: tarefaId } = useParams();
    const [tarefa] = useState<Tarefa>(mockTarefa);
    const [novoComentario, setNovoComentario] = useState("");
    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
    const [dialogExcluir, setDialogExcluir] = useState(false);
    const [dialogArquivar, setDialogArquivar] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "info" }>({
        open: false,
        message: "",
        severity: "success",
    });

    // Em produção, você buscaria a tarefa usando o tarefaId
    console.log("Tarefa ID:", tarefaId);

    const handleVoltar = () => {
        navigate("/projetos");
    };

    const handleEnviarComentario = () => {
        if (novoComentario.trim()) {
            // Aqui você adicionaria o comentário via API
            console.log("Novo comentário:", novoComentario);
            setNovoComentario("");
        }
    };

    const handleAbrirMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleFecharMenu = () => {
        setMenuAnchorEl(null);
    };

    const handleEditar = () => {
        console.log("Editar tarefa");
        setSnackbar({
            open: true,
            message: "Função de edição em desenvolvimento",
            severity: "info",
        });
    };

    const handleDuplicar = () => {
        console.log("Duplicar tarefa");
        setSnackbar({
            open: true,
            message: "Tarefa duplicada com sucesso!",
            severity: "success",
        });
    };

    const handleArquivar = () => {
        setDialogArquivar(true);
    };

    const handleConfirmarArquivar = () => {
        console.log("Tarefa arquivada");
        setDialogArquivar(false);
        setSnackbar({
            open: true,
            message: "Tarefa arquivada com sucesso!",
            severity: "success",
        });
    };

    const handleAdicionarResponsavel = () => {
        console.log("Adicionar responsável");
        setSnackbar({
            open: true,
            message: "Função em desenvolvimento",
            severity: "info",
        });
    };

    const handleAlterarData = () => {
        console.log("Alterar data limite");
        setSnackbar({
            open: true,
            message: "Função em desenvolvimento",
            severity: "info",
        });
    };

    const handleExcluir = () => {
        setDialogExcluir(true);
    };

    const handleConfirmarExcluir = () => {
        console.log("Tarefa excluída");
        setDialogExcluir(false);
        setSnackbar({
            open: true,
            message: "Tarefa excluída com sucesso!",
            severity: "success",
        });
        // Aguarda um pouco para mostrar o snackbar antes de navegar
        setTimeout(() => {
            navigate("/projetos");
        }, 1500);
    };

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
                                {tarefa.titulo}
                            </Typography>
                            <Chip
                                label={tarefa.prioridade}
                                color={getPrioridadeColor(tarefa.prioridade)}
                                size="small"
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {tarefa.projeto} • Criada em {new Date(tarefa.dataCriacao).toLocaleDateString("pt-BR")}
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
                />
            </Box>

            <Grid container spacing={3}>
                {/* Coluna Principal */}
                <Grid size={{ xs: 12, md: 8 }}>
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
                            {tarefa.descricao}
                        </Typography>
                    </Paper>

                    {/* Anexos */}
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <AttachFileOutlined fontSize="small" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Anexos ({tarefa.anexos.length})
                            </Typography>
                        </Box>
                        <List>
                            {tarefa.anexos.map((anexo) => (
                                <Box key={anexo.id}>
                                    <ListItem
                                        sx={{
                                            bgcolor: "grey.50",
                                            borderRadius: 1.5,
                                            mb: 1,
                                            cursor: "pointer",
                                            "&:hover": { bgcolor: "grey.100" },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                                <AttachFileOutlined />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={anexo.nome}
                                            secondary={`${anexo.tamanho} • ${new Date(anexo.data).toLocaleDateString("pt-BR")}`}
                                        />
                                    </ListItem>
                                </Box>
                            ))}
                        </List>
                    </Paper>

                    {/* Comentários */}
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                            <ChatBubbleOutlineOutlined fontSize="small" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Comentários ({tarefa.comentarios.length})
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            {tarefa.comentarios.map((comentario) => (
                                <Box key={comentario.id} sx={{ mb: 3 }}>
                                    <Box sx={{ display: "flex", gap: 2 }}>
                                        <Avatar sx={{ bgcolor: "primary.main" }}>
                                            {comentario.autor.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {comentario.autor}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    {comentario.data}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                {comentario.texto}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Avatar sx={{ bgcolor: "primary.main" }}>U</Avatar>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Adicione um comentário..."
                                value={novoComentario}
                                onChange={(e) => setNovoComentario(e.target.value)}
                            />
                            <IconButton
                                color="primary"
                                onClick={handleEnviarComentario}
                                disabled={!novoComentario.trim()}
                            >
                                <SendOutlined />
                            </IconButton>
                        </Box>
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
                            <Chip label={tarefa.status} color="primary" />
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
                                label={tarefa.prioridade}
                                color={getPrioridadeColor(tarefa.prioridade)}
                            />
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Responsáveis */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <PersonOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                    RESPONSÁVEIS
                                </Typography>
                            </Box>
                            <AvatarGroup max={4}>
                                {tarefa.responsaveis.map((responsavel) => (
                                    <Avatar
                                        key={responsavel.id}
                                        sx={{ bgcolor: "primary.main" }}
                                        title={responsavel.nome}
                                    >
                                        {responsavel.nome.charAt(0)}
                                    </Avatar>
                                ))}
                            </AvatarGroup>
                            <Box sx={{ mt: 1 }}>
                                {tarefa.responsaveis.map((responsavel) => (
                                    <Typography
                                        key={responsavel.id}
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        {responsavel.nome}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Data Limite */}
                        {tarefa.dataLimite && (
                            <>
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <CalendarTodayOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                            DATA LIMITE
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {new Date(tarefa.dataLimite).toLocaleDateString("pt-BR", {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </Typography>
                                </Box>

                                <Divider sx={{ mb: 3 }} />
                            </>
                        )}

                        {/* Tags */}
                        {tarefa.tags.length > 0 && (
                            <Box>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 1, display: "block" }}>
                                    TAGS
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {tarefa.tags.map((tag) => (
                                        <Chip key={tag} label={tag} size="small" />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

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
                        Tem certeza que deseja excluir a tarefa "<strong>{tarefa.titulo}</strong>"?
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
                        Deseja arquivar a tarefa "<strong>{tarefa.titulo}</strong>"?
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
