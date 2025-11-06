import type { ReactNode } from "react";
import { Box, Divider, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from "@mui/material";
import {
    DashboardOutlined,
    AssessmentOutlined,
    PeopleAltOutlined,
    GroupsOutlined,
    FolderOutlined,
    ForumOutlined,
    NotificationsNoneOutlined,
    PersonOutline,
    SettingsOutlined,
    ChevronLeft,
    ChevronRight,
} from "@mui/icons-material";
import { Link as RouterLink, useLocation } from "react-router-dom";


type NavItem = {
    label: string;
    path: string;
    icon: ReactNode;
};

const primaryItems: NavItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlined fontSize="small" /> },
    { label: "Relatorios", path: "/relatorios", icon: <AssessmentOutlined fontSize="small" /> },
    { label: "Usuarios", path: "/usuarios", icon: <PeopleAltOutlined fontSize="small" /> },
    { label: "Equipes", path: "/equipes", icon: <GroupsOutlined fontSize="small" /> },
    { label: "Projetos", path: "/projetos", icon: <FolderOutlined fontSize="small" /> },
];

const secondaryItems: NavItem[] = [
    { label: "Chat", path: "/chat", icon: <ForumOutlined fontSize="small" /> },
    { label: "Notificacoes", path: "/notificacoes", icon: <NotificationsNoneOutlined fontSize="small" /> },
    { label: "Perfil", path: "/perfil", icon: <PersonOutline fontSize="small" /> },
    { label: "Configuracoes", path: "/configuracoes", icon: <SettingsOutlined fontSize="small" /> },
];

function isActivePath(currentPath: string, targetPath: string) {
    if (targetPath === "/") return currentPath === targetPath;
    return currentPath === targetPath || currentPath.startsWith(targetPath + "/");
}

type SidebarProps = {
    open: boolean;
    onToggle: () => void;
};

export default function Sidebar({ open, onToggle }: SidebarProps) {
    const location = useLocation();

    const renderItem = (item: NavItem) => {
        const active = isActivePath(location.pathname, item.path);

        return (
            <Tooltip key={item.path} title={!open ? item.label : ""} placement="right">
                <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    selected={active}
                    sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        justifyContent: open ? "initial" : "center",
                        px: open ? 2 : 1.5,
                    }}
                >
                    <ListItemIcon sx={{
                        minWidth: open ? 36 : "auto",
                        color: active ? "primary.main" : "text.secondary",
                        "& svg": { fontSize: 20 }
                    }}>
                        {item.icon}
                    </ListItemIcon>
                    {open && <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 600 : 500 }} />}
                </ListItemButton>
            </Tooltip>
        );
    };

    return (
        <Box
            component="aside"
            sx={{
                width: open ? 260 : 80,
                flexShrink: 0,
                bgcolor: "common.white",
                borderRight: (theme) => "1px solid " + theme.palette.divider,
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                transition: "width 0.3s ease",
            }}
        >
            <Box sx={{ px: open ? 3 : 2, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
                {open ? (
                    <>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                Oriente
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Navegacao
                            </Typography>
                        </Box>
                        <IconButton onClick={onToggle} size="small" aria-label="Recolher menu">
                            <ChevronLeft />
                        </IconButton>
                    </>
                ) : (
                    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "1.1rem" }}>
                            OR
                        </Typography>
                        <IconButton onClick={onToggle} size="small" aria-label="Expandir menu">
                            <ChevronRight />
                        </IconButton>
                    </Box>
                )}
            </Box>

            <Box sx={{ px: 1.5, pb: 1 }}>
                {open && (
                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Principal
                    </Typography>
                )}
                <List component="nav" disablePadding>
                    {primaryItems.map((item) => renderItem(item))}
                </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ px: 1.5, pb: 1 }}>
                {open && (
                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Suporte
                    </Typography>
                )}
                <List component="nav" disablePadding>
                    {secondaryItems.map((item) => renderItem(item))}
                </List>
            </Box>

            <Box sx={{ flexGrow: 1 }} />
        </Box>
    );
}
