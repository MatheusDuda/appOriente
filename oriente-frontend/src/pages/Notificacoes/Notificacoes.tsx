import { useState, useEffect } from "react";
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
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    NotificationsOutlined,
    TaskAltOutlined,
    PersonAddOutlined,
    MoreVertOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    DoneAllOutlined,
} from "@mui/icons-material";
import { useNotifications } from "../../hooks/useNotifications";
import type { NotificationType } from "../../types/notifications";

// Função para obter ícone e cor de fundo baseado no tipo
const getNotificationStyle = (tipo: NotificationType) => {
    switch (tipo) {
        case "TASK":
            return {
                icone: <TaskAltOutlined />,
                corFundo: "#e3f2fd",
            };
        case "TEAM":
            return {
                icone: <PersonAddOutlined />,
                corFundo: "#f3e5f5",
            };
        case "SYSTEM":
            return {
                icone: <NotificationsOutlined />,
                corFundo: "#fce4ec",
            };
        default:
            return {
                icone: <NotificationsOutlined />,
                corFundo: "#e0e0e0",
            };
    }
};

// Função para formatar timestamp relativo
const formatarTimestamp = (dataISO: string): string => {
    const data = new Date(dataISO);
    const agora = new Date();
    const diferencaMs = agora.getTime() - data.getTime();
    const diferencaMinutos = Math.floor(diferencaMs / 60000);
    const diferencaHoras = Math.floor(diferencaMs / 3600000);
    const diferencaDias = Math.floor(diferencaMs / 86400000);

    if (diferencaMinutos < 1) return "Agora mesmo";
    if (diferencaMinutos < 60) return `${diferencaMinutos} min atrás`;
    if (diferencaHoras < 24) return `${diferencaHoras} hora${diferencaHoras > 1 ? "s" : ""} atrás`;
    if (diferencaDias === 1) return "Ontem";
    if (diferencaDias < 7) return `${diferencaDias} dias atrás`;

    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export default function Notificacoes() {
    const {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        setError,
    } = useNotifications();

    const [tabAtiva, setTabAtiva] = useState<"todas" | "nao-lidas">("todas");
    const [menuAnchorEl, setMenuAnchorEl] = useState<{ el: HTMLElement; id: number } | null>(null);

    // Atualizar notificações ao montar e quando mudar a tab
    useEffect(() => {
        const filters = tabAtiva === "nao-lidas" ? { unread_only: true } : {};
        fetchNotifications(filters);
    }, [tabAtiva, fetchNotifications]);

    const notificacoesFiltradas =
        tabAtiva === "todas"
            ? notifications
            : notifications.filter((n) => !n.is_read);

    const handleMarcarComoLida = async (id: number) => {
        try {
            await markAsRead(id);
        } catch (err) {
            console.error("Erro ao marcar como lida:", err);
        }
    };

    const handleExcluir = async (id: number) => {
        try {
            await deleteNotification(id);
            setMenuAnchorEl(null);
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    };

    const handleMarcarTodasComoLidas = async () => {
        try {
            await markAllAsRead();
        } catch (err) {
            console.error("Erro ao marcar todas como lidas:", err);
        }
    };

    const handleAbrirMenu = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setMenuAnchorEl({ el: event.currentTarget, id });
    };

    const handleFecharMenu = () => {
        setMenuAnchorEl(null);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Erro */}
            {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Notificações
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {unreadCount > 0
                            ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? "ões" : ""} não lida${unreadCount > 1 ? "s" : ""}`
                            : "Todas as notificações foram lidas"}
                    </Typography>
                </Box>
                {unreadCount > 0 && (
                    <Button
                        startIcon={<DoneAllOutlined />}
                        variant="outlined"
                        onClick={handleMarcarTodasComoLidas}
                        disabled={loading}
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
                            label={`Todas (${notifications.length})`}
                            value="todas"
                        />
                        <Tab
                            label={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    Não lidas
                                    {unreadCount > 0 && (
                                        <Chip
                                            label={unreadCount}
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

                {/* Loading */}
                {loading && (
                    <Box
                        sx={{
                            py: 8,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {/* Lista de Notificações */}
                {!loading && notificacoesFiltradas.length === 0 ? (
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
                    !loading && (
                        <List sx={{ p: 0 }}>
                            {notificacoesFiltradas.map((notificacao, index) => {
                                const style = getNotificationStyle(notificacao.type);
                                return (
                                    <Box key={notificacao.id}>
                                        <ListItem
                                            sx={{
                                                py: 2.5,
                                                px: 3,
                                                bgcolor: notificacao.is_read ? "transparent" : "action.hover",
                                                cursor: "pointer",
                                                "&:hover": {
                                                    bgcolor: notificacao.is_read ? "action.hover" : "action.selected",
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
                                                if (!notificacao.is_read) {
                                                    handleMarcarComoLida(notificacao.id);
                                                }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: style.corFundo,
                                                        color: "primary.main",
                                                    }}
                                                >
                                                    {style.icone}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{ fontWeight: notificacao.is_read ? 500 : 600 }}
                                                        >
                                                            {notificacao.title}
                                                        </Typography>
                                                        {!notificacao.is_read && (
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
                                                            {notificacao.message}
                                                        </Typography>
                                                        <Typography
                                                            component="span"
                                                            variant="caption"
                                                            sx={{ color: "text.disabled" }}
                                                        >
                                                            {formatarTimestamp(notificacao.created_at)}
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
                                );
                            })}
                        </List>
                    )
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
                {menuAnchorEl && !notifications.find((n) => n.id === menuAnchorEl.id)?.is_read && (
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
