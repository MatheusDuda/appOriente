import { useState } from "react";
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
} from "@mui/material";
import {
    LogoutOutlined,
    NotificationsNoneOutlined,
    PersonOutline,
    SettingsOutlined,
    TaskAltOutlined,
    PersonAddOutlined,
    ChatBubbleOutlineOutlined,
    NotificationsOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Notificacao = {
    id: number;
    tipo: "tarefa" | "equipe" | "chat" | "sistema";
    titulo: string;
    mensagem: string;
    timestamp: string;
    lida: boolean;
    icone: React.ReactNode;
    corFundo: string;
};

const mockNotificacoesRecentes: Notificacao[] = [
    {
        id: 1,
        tipo: "tarefa",
        titulo: "Nova tarefa atribuída",
        mensagem: "João Silva atribuiu você à tarefa 'Implementar autenticação JWT'",
        timestamp: "5 min atrás",
        lida: false,
        icone: <TaskAltOutlined fontSize="small" />,
        corFundo: "#e3f2fd",
    },
    {
        id: 2,
        tipo: "equipe",
        titulo: "Adicionado à equipe",
        mensagem: "Você foi adicionado à equipe 'Desenvolvimento Frontend'",
        timestamp: "1 hora atrás",
        lida: false,
        icone: <PersonAddOutlined fontSize="small" />,
        corFundo: "#f3e5f5",
    },
    {
        id: 3,
        tipo: "chat",
        titulo: "Nova mensagem",
        mensagem: "Maria Santos: Podemos revisar o código amanhã?",
        timestamp: "2 horas atrás",
        lida: true,
        icone: <ChatBubbleOutlineOutlined fontSize="small" />,
        corFundo: "#e8f5e9",
    },
];

export default function Topbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const notifOpen = Boolean(notifAnchorEl);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleOpenNotifMenu = (event: React.MouseEvent<HTMLElement>) => {
        setNotifAnchorEl(event.currentTarget);
    };

    const handleCloseNotifMenu = () => {
        setNotifAnchorEl(null);
    };

    const handleLogout = async () => {
        handleCloseMenu();
        await logout();
        navigate("/");
    };

    // Função para obter as iniciais do nome
    const getInitials = (name?: string) => {
        if (!name) return "OR";
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const naoLidasCount = mockNotificacoesRecentes.filter((n) => !n.lida).length;

    return (
        <Box
            component="header"
            sx={{
                bgcolor: "common.white",
                borderBottom: (theme) => "1px solid " + theme.palette.divider,
                px: { xs: 2, md: 4 },
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                height: 64,
            }}
        >
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Painel
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Bem-vindo de volta
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
                    <Badge badgeContent={naoLidasCount} color="error" overlap="circular">
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
                        {naoLidasCount > 0 && (
                            <Badge badgeContent={naoLidasCount} color="primary" />
                        )}
                    </Box>
                    <Divider />

                    {mockNotificacoesRecentes.length === 0 ? (
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
                            {mockNotificacoesRecentes.map((notificacao, index) => (
                                <Box key={notificacao.id}>
                                    <ListItem
                                        sx={{
                                            py: 1.5,
                                            px: 2,
                                            bgcolor: notificacao.lida ? "transparent" : "action.hover",
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
                                                    bgcolor: notificacao.corFundo,
                                                    color: "primary.main",
                                                    width: 40,
                                                    height: 40,
                                                }}
                                            >
                                                {notificacao.icone}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: notificacao.lida ? 500 : 600,
                                                            flex: 1,
                                                        }}
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
                                                        variant="caption"
                                                        sx={{
                                                            display: "block",
                                                            color: "text.secondary",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
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
                                    {index < mockNotificacoesRecentes.length - 1 && (
                                        <Divider component="li" />
                                    )}
                                </Box>
                            ))}
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
                        {getInitials(user?.name)}
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
                            {user?.name || "Usuário"}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {user?.email || "usuario@oriente.com"}
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
