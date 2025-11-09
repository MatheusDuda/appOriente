import { useState, useEffect } from "react";
import {
    Avatar,
    Badge,
    Box,
    Divider,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Button,
    CircularProgress,
} from "@mui/material";
import {
    LogoutOutlined,
    NotificationsNoneOutlined,
    PersonOutline,
    SettingsOutlined,
    TaskAltOutlined,
    PersonAddOutlined,
    NotificationsOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationType } from "../types/notifications";
import { authService, type UserData } from "../services/authService";

// Função para obter ícone e cor de fundo baseado no tipo
const getNotificationStyle = (tipo: NotificationType) => {
    switch (tipo) {
        case "TASK":
            return {
                icone: <TaskAltOutlined fontSize="small" />,
                corFundo: "action.hover",
            };
        case "TEAM":
            return {
                icone: <PersonAddOutlined fontSize="small" />,
                corFundo: "action.selected",
            };
        case "SYSTEM":
            return {
                icone: <NotificationsOutlined fontSize="small" />,
                corFundo: "action.hover",
            };
        default:
            return {
                icone: <NotificationsOutlined fontSize="small" />,
                corFundo: "action.disabledBackground",
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

    if (diferencaMinutos < 1) return "Agora mesmo";
    if (diferencaMinutos < 60) return `${diferencaMinutos} min atrás`;
    if (diferencaHoras < 24) return `${diferencaHoras} hora${diferencaHoras > 1 ? "s" : ""} atrás`;
    return "Há mais de 1 dia";
};

// Função para formatar data por extenso
const formatarDataPorExtenso = (): string => {
    const agora = new Date();
    const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

    const diaSemana = diasSemana[agora.getDay()];
    const dia = agora.getDate();
    const mes = meses[agora.getMonth()];
    const ano = agora.getFullYear();

    return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
};

type TopbarProps = {
    sidebarOpen?: boolean;
};

export default function Topbar({ sidebarOpen = true }: TopbarProps) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const open = Boolean(anchorEl);
    const notifOpen = Boolean(notifAnchorEl);

    // Usar hook de notificações apenas quando necessário
    const { notifications, unreadCount, loading, fetchNotifications } = useNotifications(false);

    // Buscar dados do usuário logado
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = await authService.getCurrentUser();
                setUserData(user);
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
            }
        };
        fetchUserData();
    }, []);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleOpenNotifMenu = (event: React.MouseEvent<HTMLElement>) => {
        setNotifAnchorEl(event.currentTarget);
        // Buscar notificações recentes (apenas 5) ao abrir o menu
        fetchNotifications({ limit: 5 });
    };

    const handleCloseNotifMenu = () => {
        setNotifAnchorEl(null);
    };

    const handleLogout = () => {
        handleCloseMenu();
        localStorage.removeItem("auth_token");
        navigate("/");
    };

    // Buscar contador de não lidas ao montar o componente
    useEffect(() => {
        fetchNotifications({ limit: 5 });

        // Atualizar contador a cada 60 segundos
        const interval = setInterval(() => {
            fetchNotifications({ limit: 5 });
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Pegar apenas as 5 notificações mais recentes
    const notificacoesRecentes = notifications.slice(0, 5);

    // Gerar iniciais do nome do usuário
    const getInitials = (name: string | undefined): string => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <Box
            component="header"
            sx={{
                position: "fixed",
                top: 0,
                left: { xs: 0, md: sidebarOpen ? '260px' : '80px' },
                right: 0,
                zIndex: 1100,
                bgcolor: "background.paper",
                borderBottom: (theme) => "1px solid " + theme.palette.divider,
                px: { xs: 2, md: 4 },
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                height: 64,
                transition: 'left 0.3s ease',
            }}
        >
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {userData?.name || "Carregando..."}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {formatarDataPorExtenso()}
                </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconButton
                    color="primary"
                    size="small"
                    aria-label="Abrir notificacoes"
                    onClick={handleOpenNotifMenu}
                    aria-controls={notifOpen ? "notif-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={notifOpen ? "true" : undefined}
                >
                    <Badge badgeContent={unreadCount} color="error" overlap="circular">
                        <NotificationsNoneOutlined />
                    </Badge>
                </IconButton>

                <Menu
                    id="notif-menu"
                    anchorEl={notifAnchorEl}
                    open={notifOpen}
                    onClose={handleCloseNotifMenu}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    slotProps={{
                        paper: {
                            elevation: 3,
                            sx: {
                                mt: 1.5,
                                width: 380,
                                maxWidth: "90vw",
                                borderRadius: 2,
                                maxHeight: 500,
                            },
                        },
                    }}
                >
                    <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Notificações
                        </Typography>
                        {unreadCount > 0 && (
                            <Badge badgeContent={unreadCount} color="primary" />
                        )}
                    </Box>
                    <Divider />

                    {loading ? (
                        <Box sx={{ py: 6, textAlign: "center" }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : notificacoesRecentes.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: "center" }}>
                            <NotificationsOutlined
                                sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                            />
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Nenhuma notificação
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0, maxHeight: 360, overflow: "auto" }}>
                            {notificacoesRecentes.map((notificacao, index) => {
                                const style = getNotificationStyle(notificacao.type);
                                return (
                                    <Box key={notificacao.id}>
                                        <ListItem
                                            sx={{
                                                py: 1.5,
                                                px: 2,
                                                bgcolor: notificacao.is_read ? "transparent" : "action.hover",
                                                cursor: "pointer",
                                                "&:hover": {
                                                    bgcolor: "action.selected",
                                                },
                                            }}
                                            onClick={() => {
                                                handleCloseNotifMenu();
                                                navigate("/notificacoes");
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: style.corFundo,
                                                        color: "primary.main",
                                                        width: 40,
                                                        height: 40,
                                                    }}
                                                >
                                                    {style.icone}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: notificacao.is_read ? 500 : 600,
                                                                flex: 1,
                                                            }}
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
                                                            variant="caption"
                                                            sx={{
                                                                display: "block",
                                                                color: "text.secondary",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
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
                                        {index < notificacoesRecentes.length - 1 && (
                                            <Divider component="li" />
                                        )}
                                    </Box>
                                );
                            })}
                        </List>
                    )}

                    <Divider />
                    <Box sx={{ p: 1 }}>
                        <Button
                            fullWidth
                            onClick={() => {
                                handleCloseNotifMenu();
                                navigate("/notificacoes");
                            }}
                        >
                            Ver todas as notificações
                        </Button>
                    </Box>
                </Menu>

                <IconButton
                    onClick={handleOpenMenu}
                    size="small"
                    aria-label="Menu do usuario"
                    aria-controls={open ? "user-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
                        {getInitials(userData?.name)}
                    </Avatar>
                </IconButton>

                <Menu
                    id="user-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleCloseMenu}
                    onClick={handleCloseMenu}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    slotProps={{
                        paper: {
                            elevation: 3,
                            sx: {
                                mt: 1.5,
                                minWidth: 200,
                                borderRadius: 2,
                            },
                        },
                    }}
                >
                    <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {userData?.name || "Carregando..."}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {userData?.email || ""}
                        </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => navigate("/perfil")}>
                        <ListItemIcon>
                            <PersonOutline fontSize="small" />
                        </ListItemIcon>
                        Meu Perfil
                    </MenuItem>
                    <MenuItem onClick={() => navigate("/configuracoes")}>
                        <ListItemIcon>
                            <SettingsOutlined fontSize="small" />
                        </ListItemIcon>
                        Configurações
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutOutlined fontSize="small" />
                        </ListItemIcon>
                        Sair
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );
}
