import { useState } from "react";
import { Avatar, Badge, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Typography } from "@mui/material";
import { LogoutOutlined, NotificationsNoneOutlined, PersonOutline, SettingsOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleCloseMenu();
        localStorage.removeItem("auth_token");
        navigate("/");
    };

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
                <IconButton color="primary" size="small" aria-label="Abrir notificacoes">
                    <Badge color="error" variant="dot" overlap="circular">
                        <NotificationsNoneOutlined />
                    </Badge>
                </IconButton>

                <IconButton
                    onClick={handleOpenMenu}
                    size="small"
                    aria-label="Menu do usuario"
                    aria-controls={open ? "user-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
                        OR
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
                            Usuário Oriente
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            usuario@oriente.com
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
