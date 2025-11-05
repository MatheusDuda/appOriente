import { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Chip,
    Tabs,
    Tab,
    Button,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    NotificationsOutlined,
    TaskAltOutlined,
    PersonAddOutlined,
    ChatBubbleOutlineOutlined,
    WarningAmberOutlined,
    MoreVertOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    DoneAllOutlined,
} from "@mui/icons-material";

type TipoNotificacao = "tarefa" | "equipe" | "chat" | "sistema";

type Notificacao = {
    id: number;
    tipo: TipoNotificacao;
    titulo: string;
    mensagem: string;
    timestamp: string;
    lida: boolean;
    icone: React.ReactNode;
    corFundo: string;
};

const mockNotificacoes: Notificacao[] = [
    {
        id: 1,
        tipo: "tarefa",
        titulo: "Nova tarefa atribuída",
        mensagem: "João Silva atribuiu você à tarefa 'Implementar autenticação JWT'",
        timestamp: "5 min atrás",
        lida: false,
        icone: <TaskAltOutlined />,
        corFundo: "#e3f2fd",
    },
    {
        id: 2,
        tipo: "equipe",
        titulo: "Adicionado à equipe",
        mensagem: "Você foi adicionado à equipe 'Desenvolvimento Frontend'",
        timestamp: "1 hora atrás",
        lida: false,
        icone: <PersonAddOutlined />,
        corFundo: "#f3e5f5",
    },
    {
        id: 3,
        tipo: "chat",
        titulo: "Nova mensagem",
        mensagem: "Maria Santos: Podemos revisar o código amanhã?",
        timestamp: "2 horas atrás",
        lida: true,
        icone: <ChatBubbleOutlineOutlined />,
        corFundo: "#e8f5e9",
    },
    {
        id: 4,
        tipo: "tarefa",
        titulo: "Prazo próximo",
        mensagem: "A tarefa 'Configurar CI/CD' vence amanhã",
        timestamp: "3 horas atrás",
        lida: false,
        icone: <WarningAmberOutlined />,
        corFundo: "#fff3e0",
    },
    {
        id: 5,
        tipo: "sistema",
        titulo: "Atualização do sistema",
        mensagem: "Nova versão disponível. Algumas funcionalidades foram melhoradas.",
        timestamp: "Ontem",
        lida: true,
        icone: <NotificationsOutlined />,
        corFundo: "#fce4ec",
    },
    {
        id: 6,
        tipo: "tarefa",
        titulo: "Tarefa concluída",
        mensagem: "Ana Oliveira marcou a tarefa 'Testes unitários' como concluída",
        timestamp: "Ontem",
        lida: true,
        icone: <TaskAltOutlined />,
        corFundo: "#e3f2fd",
    },
    {
        id: 7,
        tipo: "chat",
        titulo: "Menção em comentário",
        mensagem: "Carlos Lima mencionou você em um comentário",
        timestamp: "2 dias atrás",
        lida: true,
        icone: <ChatBubbleOutlineOutlined />,
        corFundo: "#e8f5e9",
    },
];

export default function Notificacoes() {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>(mockNotificacoes);
    const [tabAtiva, setTabAtiva] = useState<"todas" | "nao-lidas">("todas");
    const [menuAnchorEl, setMenuAnchorEl] = useState<{ el: HTMLElement; id: number } | null>(null);

    const notificacoesFiltradas =
        tabAtiva === "todas"
            ? notificacoes
            : notificacoes.filter((n) => !n.lida);

    const naoLidasCount = notificacoes.filter((n) => !n.lida).length;

    const handleMarcarComoLida = (id: number) => {
        setNotificacoes(
            notificacoes.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
    };

    const handleExcluir = (id: number) => {
        setNotificacoes(notificacoes.filter((n) => n.id !== id));
        setMenuAnchorEl(null);
    };

    const handleMarcarTodasComoLidas = () => {
        setNotificacoes(notificacoes.map((n) => ({ ...n, lida: true })));
    };

    const handleAbrirMenu = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setMenuAnchorEl({ el: event.currentTarget, id });
    };

    const handleFecharMenu = () => {
        setMenuAnchorEl(null);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Notificações
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {naoLidasCount > 0
                            ? `Você tem ${naoLidasCount} notificação${naoLidasCount > 1 ? "ões" : ""} não lida${naoLidasCount > 1 ? "s" : ""}`
                            : "Todas as notificações foram lidas"}
                    </Typography>
                </Box>
                {naoLidasCount > 0 && (
                    <Button
                        startIcon={<DoneAllOutlined />}
                        variant="outlined"
                        onClick={handleMarcarTodasComoLidas}
                    >
                        Marcar todas como lidas
                    </Button>
                )}
            </Box>

            <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 2 }}>
                    <Tabs
                        value={tabAtiva}
                        onChange={(_, value) => setTabAtiva(value)}
                    >
                        <Tab
                            label={`Todas (${notificacoes.length})`}
                            value="todas"
                        />
                        <Tab
                            label={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    Não lidas
                                    {naoLidasCount > 0 && (
                                        <Chip
                                            label={naoLidasCount}
                                            size="small"
                                            color="primary"
                                            sx={{ height: 20, minWidth: 20 }}
                                        />
                                    )}
                                </Box>
                            }
                            value="nao-lidas"
                        />
                    </Tabs>
                </Box>

                {/* Lista de Notificações */}
                {notificacoesFiltradas.length === 0 ? (
                    <Box
                        sx={{
                            py: 8,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <NotificationsOutlined
                            sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                        />
                        <Typography variant="h6" sx={{ color: "text.secondary" }}>
                            Nenhuma notificação
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.disabled" }}>
                            {tabAtiva === "todas"
                                ? "Você não tem notificações ainda"
                                : "Todas as notificações foram lidas"}
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notificacoesFiltradas.map((notificacao, index) => (
                            <Box key={notificacao.id}>
                                <ListItem
                                    sx={{
                                        py: 2.5,
                                        px: 3,
                                        bgcolor: notificacao.lida ? "transparent" : "action.hover",
                                        cursor: "pointer",
                                        "&:hover": {
                                            bgcolor: notificacao.lida ? "action.hover" : "action.selected",
                                        },
                                        transition: "background-color 0.2s",
                                    }}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => handleAbrirMenu(e, notificacao.id)}
                                        >
                                            <MoreVertOutlined />
                                        </IconButton>
                                    }
                                    onClick={() => {
                                        if (!notificacao.lida) {
                                            handleMarcarComoLida(notificacao.id);
                                        }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            sx={{
                                                bgcolor: notificacao.corFundo,
                                                color: "primary.main",
                                            }}
                                        >
                                            {notificacao.icone}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{ fontWeight: notificacao.lida ? 500 : 600 }}
                                                >
                                                    {notificacao.titulo}
                                                </Typography>
                                                {!notificacao.lida && (
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: "50%",
                                                            bgcolor: "primary.main",
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    sx={{
                                                        display: "block",
                                                        color: "text.secondary",
                                                        mb: 0.5,
                                                    }}
                                                >
                                                    {notificacao.mensagem}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    sx={{ color: "text.disabled" }}
                                                >
                                                    {notificacao.timestamp}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                                {index < notificacoesFiltradas.length - 1 && (
                                    <Box sx={{ px: 3 }}>
                                        <Box sx={{ borderBottom: 1, borderColor: "divider" }} />
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Menu de Opções */}
            <Menu
                anchorEl={menuAnchorEl?.el}
                open={Boolean(menuAnchorEl)}
                onClose={handleFecharMenu}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                slotProps={{
                    paper: {
                        elevation: 3,
                        sx: {
                            minWidth: 200,
                            borderRadius: 2,
                            mt: 1,
                        },
                    },
                }}
            >
                {menuAnchorEl && !notificacoes.find((n) => n.id === menuAnchorEl.id)?.lida && (
                    <MenuItem
                        onClick={() => {
                            handleMarcarComoLida(menuAnchorEl.id);
                            handleFecharMenu();
                        }}
                    >
                        <CheckCircleOutlined fontSize="small" sx={{ mr: 1 }} />
                        Marcar como lida
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() => {
                        if (menuAnchorEl) {
                            handleExcluir(menuAnchorEl.id);
                        }
                    }}
                    sx={{ color: "error.main" }}
                >
                    <DeleteOutlined fontSize="small" sx={{ mr: 1 }} />
                    Excluir
                </MenuItem>
            </Menu>
        </Box>
    );
}
