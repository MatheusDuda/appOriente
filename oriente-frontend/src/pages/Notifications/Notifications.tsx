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
const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
        case "TASK":
            return {
                icon: <TaskAltOutlined />,
                backgroundColor: "#e3f2fd",
            };
        case "TEAM":
            return {
                icon: <PersonAddOutlined />,
                backgroundColor: "#f3e5f5",
            };
        case "SYSTEM":
            return {
                icon: <NotificationsOutlined />,
                backgroundColor: "#fce4ec",
            };
        default:
            return {
                icon: <NotificationsOutlined />,
                backgroundColor: "#e0e0e0",
            };
    }
};

// Função para formatar timestamp relativo
const formatTimestamp = (dateISO: string): string => {
    const date = new Date(dateISO);
    const now = new Date();
    const differenceMs = now.getTime() - date.getTime();
    const differenceMinutes = Math.floor(differenceMs / 60000);
    const differenceHours = Math.floor(differenceMs / 3600000);
    const differenceDays = Math.floor(differenceMs / 86400000);

    if (differenceMinutes < 1) return "Agora mesmo";
    if (differenceMinutes < 60) return `${differenceMinutes} min atrás`;
    if (differenceHours < 24) return `${differenceHours} hora${differenceHours > 1 ? "s" : ""} atrás`;
    if (differenceDays === 1) return "Ontem";
    if (differenceDays < 7) return `${differenceDays} dias atrás`;

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export default function Notifications() {
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

    const [activeTab, setActiveTab] = useState<"todas" | "nao-lidas">("todas");
    const [menuAnchorEl, setMenuAnchorEl] = useState<{ el: HTMLElement; id: number } | null>(null);

    // Atualizar notificações ao montar e quando mudar a tab
    useEffect(() => {
        const filters = activeTab === "nao-lidas" ? { unread_only: true } : {};
        fetchNotifications(filters);
    }, [activeTab, fetchNotifications]);

    const filteredNotifications =
        activeTab === "todas"
            ? notifications
            : notifications.filter((n) => !n.is_read);

    const handleMarkAsRead = async (id: number) => {
        try {
            await markAsRead(id);
        } catch (err) {
            console.error("Erro ao marcar como lida:", err);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteNotification(id);
            setMenuAnchorEl(null);
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (err) {
            console.error("Erro ao marcar todas como lidas:", err);
        }
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, id: number) => {
        setMenuAnchorEl({ el: event.currentTarget, id });
    };

    const handleCloseMenu = () => {
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
                        onClick={handleMarkAllAsRead}
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
                        value={activeTab}
                        onChange={(_, value) => setActiveTab(value)}
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
                {!loading && filteredNotifications.length === 0 ? (
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
                            {activeTab === "todas"
                                ? "Você não tem notificações ainda"
                                : "Todas as notificações foram lidas"}
                        </Typography>
                    </Box>
                ) : (
                    !loading && (
                        <List sx={{ p: 0 }}>
                            {filteredNotifications.map((notification, index) => {
                                const style = getNotificationStyle(notification.type);
                                return (
                                    <Box key={notification.id}>
                                        <ListItem
                                            sx={{
                                                py: 2.5,
                                                px: 3,
                                                bgcolor: notification.is_read ? "transparent" : "action.hover",
                                                cursor: "pointer",
                                                "&:hover": {
                                                    bgcolor: notification.is_read ? "action.hover" : "action.selected",
                                                },
                                                transition: "background-color 0.2s",
                                            }}
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => handleOpenMenu(e, notification.id)}
                                                >
                                                    <MoreVertOutlined />
                                                </IconButton>
                                            }
                                            onClick={() => {
                                                if (!notification.is_read) {
                                                    handleMarkAsRead(notification.id);
                                                }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: style.backgroundColor,
                                                        color: "primary.main",
                                                    }}
                                                >
                                                    {style.icon}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{ fontWeight: notification.is_read ? 500 : 600 }}
                                                        >
                                                            {notification.title}
                                                        </Typography>
                                                        {!notification.is_read && (
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
                                                            {notification.message}
                                                        </Typography>
                                                        <Typography
                                                            component="span"
                                                            variant="caption"
                                                            sx={{ color: "text.disabled" }}
                                                        >
                                                            {formatTimestamp(notification.created_at)}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                {index < filteredNotifications.length - 1 && (
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
                onClose={handleCloseMenu}
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
                            handleMarkAsRead(menuAnchorEl.id);
                            handleCloseMenu();
                        }}
                    >
                        <CheckCircleOutlined fontSize="small" sx={{ mr: 1 }} />
                        Marcar como lida
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() => {
                        if (menuAnchorEl) {
                            handleDelete(menuAnchorEl.id);
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
