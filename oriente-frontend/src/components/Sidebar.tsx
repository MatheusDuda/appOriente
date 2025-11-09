// arquivo: Sidebar.tsx (ou o nome do teu arquivo)

import { useState, useEffect, type ReactNode } from "react";
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
    AddOutlined,
} from "@mui/icons-material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import AddProjectDialog from "./Sidebar/AddProjectDialog";
import projectService from "../services/projectService";
import type { ProjectSummary } from "@/types";

type NavItem = {
    label: string;
    path: string;
    icon: ReactNode;
};

// Itens principais (sem mudanças)
const primaryItems: NavItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlined fontSize="small" /> },
    { label: "Relatorios", path: "/relatorios", icon: <AssessmentOutlined fontSize="small" /> },
    { label: "Usuarios", path: "/usuarios", icon: <PeopleAltOutlined fontSize="small" /> },
    { label: "Equipes", path: "/equipes", icon: <GroupsOutlined fontSize="small" /> },
    { label: "Projetos", path: "/projetos", icon: <FolderOutlined fontSize="small" /> },
];

// --- MUDANÇA 1: "Perfil" foi removido daqui ---
const secondaryItems: NavItem[] = [
    { label: "Chat", path: "/chat", icon: <ForumOutlined fontSize="small" /> },
    { label: "Notificacoes", path: "/notificacoes", icon: <NotificationsNoneOutlined fontSize="small" /> },
    { label: "Configuracoes", path: "/configuracoes", icon: <SettingsOutlined fontSize="small" /> },
];

// --- MUDANÇA 2: "Perfil" agora é um item separado ---
const footerItem: NavItem = {
    label: "Perfil",
    path: "/perfil",
    icon: <PersonOutline fontSize="small" />
};


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
    const navigate = useNavigate();
    const [pinnedProjects, setPinnedProjects] = useState<ProjectSummary[]>([]);
    const [pinnedProjectIds, setPinnedProjectIds] = useState<number[]>(() => {
        const saved = localStorage.getItem("pinnedProjectIds");
        return saved ? JSON.parse(saved) : [];
    });
    const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);

    // Buscar dados dos projetos fixados
    useEffect(() => {
        const fetchPinnedProjects = async () => {
            if (pinnedProjectIds.length === 0) {
                setPinnedProjects([]);
                return;
            }

            try {
                const allProjects = await projectService.getProjects();
                const pinned = allProjects.filter(p => pinnedProjectIds.includes(p.id));
                setPinnedProjects(pinned);
            } catch (error) {
                console.error("Erro ao buscar projetos fixados:", error);
            }
        };

        fetchPinnedProjects();
    }, [pinnedProjectIds]);

    // Salvar projetos fixados no localStorage
    useEffect(() => {
        localStorage.setItem("pinnedProjectIds", JSON.stringify(pinnedProjectIds));
    }, [pinnedProjectIds]);

    const handleToggleProject = (projectId: number) => {
        setPinnedProjectIds(prev => {
            if (prev.includes(projectId)) {
                return prev.filter(id => id !== projectId);
            } else {
                return [...prev, projectId];
            }
        });
    };

    const handleProjectClick = (projectId: number) => {
        navigate("/projetos");
        localStorage.setItem("selectedProjectId", projectId.toString());
    };

    // Função de renderização (sem mudanças)
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
                bgcolor: "background.paper",
                borderRight: (theme) => "1px solid " + theme.palette.divider,
                display: { xs: "none", md: "flex" },
                flexDirection: "column",
                transition: "width 0.3s ease",
                position: "fixed",
                height: "100vh",
                top: 0,
                left: 0,
                zIndex: 1200,
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
                    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 1}}>
                        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "1.1rem" }}>
                            O
                        </Typography>
                        <IconButton onClick={onToggle} size="small" aria-label="Expandir menu">
                            <ChevronRight />
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* Itens Primários */}
            <Box sx={{ px: 1.5, pb: 1 }}>
                {open && (
                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Principal
                    </Typography>
                )}
                <List component="nav" disablePadding>
                    {primaryItems.map((item) => renderItem(item))}

                    {/* Botão + para adicionar projetos */}
                    <Tooltip title={!open ? "Adicionar projeto ao menu" : ""} placement="right">
                        <ListItemButton
                            onClick={() => setAddProjectDialogOpen(true)}
                            sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                justifyContent: open ? "initial" : "center",
                                px: open ? 2 : 1.5,
                                pl: open ? 4 : 1.5,
                                borderLeft: open ? "2px solid" : "none",
                                borderColor: "primary.main",
                                ml: open ? 1 : 0,
                            }}
                        >
                            <ListItemIcon sx={{
                                minWidth: open ? 36 : "auto",
                                color: "primary.main",
                                "& svg": { fontSize: 18 }
                            }}>
                                <AddOutlined />
                            </ListItemIcon>
                            {open && (
                                <ListItemText
                                    primary="Adicionar projeto"
                                    primaryTypographyProps={{
                                        fontWeight: 500,
                                        fontSize: "0.875rem",
                                        color: "primary.main",
                                    }}
                                />
                            )}
                        </ListItemButton>
                    </Tooltip>

                    {/* Projetos fixados */}
                    {pinnedProjects.map((project) => (
                        <Tooltip key={project.id} title={!open ? project.name : ""} placement="right">
                            <ListItemButton
                                onClick={() => handleProjectClick(project.id)}
                                sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    justifyContent: open ? "initial" : "center",
                                    px: open ? 2 : 1.5,
                                    pl: open ? 4 : 1.5,
                                    borderLeft: open ? "2px solid" : "none",
                                    borderColor: "divider",
                                    ml: open ? 1 : 0,
                                }}
                            >
                                <ListItemIcon sx={{
                                    minWidth: open ? 36 : "auto",
                                    color: "text.secondary",
                                    "& svg": { fontSize: 18 }
                                }}>
                                    <FolderOutlined />
                                </ListItemIcon>
                                {open && (
                                    <ListItemText
                                        primary={project.name}
                                        primaryTypographyProps={{
                                            fontWeight: 400,
                                            fontSize: "0.875rem",
                                            noWrap: true,
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        </Tooltip>
                    ))}
                </List>
            </Box>

            {/* Espaçador flexível */}
            <Box sx={{ flexGrow: 1 }} />

            <Divider sx={{ my: 2 }} />

            {/* Itens Secundários (Suporte) + Perfil */}
            <Box sx={{ px: 1.5, pb: 2 }}>
                {open && (
                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        Suporte
                    </Typography>
                )}
                <List component="nav" disablePadding>
                    {secondaryItems.map((item) => renderItem(item))}
                    {renderItem(footerItem)}
                </List>
            </Box>

            {/* Modal de adicionar projetos */}
            <AddProjectDialog
                open={addProjectDialogOpen}
                onClose={() => setAddProjectDialogOpen(false)}
                pinnedProjectIds={pinnedProjectIds}
                onToggleProject={handleToggleProject}
            />
        </Box>
    );
}