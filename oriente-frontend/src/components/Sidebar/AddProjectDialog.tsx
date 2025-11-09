import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Checkbox,
    CircularProgress,
    Box,
    Typography,
    IconButton,
} from "@mui/material";
import { CloseOutlined, FolderOutlined } from "@mui/icons-material";
import projectService from "../../services/projectService";
import type { ProjectSummary } from "../../types";

type AddProjectDialogProps = {
    open: boolean;
    onClose: () => void;
    pinnedProjectIds: number[];
    onToggleProject: (projectId: number) => void;
};

export default function AddProjectDialog({
    open,
    onClose,
    pinnedProjectIds,
    onToggleProject,
}: AddProjectDialogProps) {
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            loadProjects();
        }
    }, [open]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error("Erro ao buscar projetos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (projectId: number) => {
        onToggleProject(projectId);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Adicionar Projetos ao Menu
                    </Typography>
                    <IconButton size="small" onClick={onClose}>
                        <CloseOutlined />
                    </IconButton>
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                    Selecione os projetos que deseja fixar no menu lateral para acesso rápido
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : projects.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            Você ainda não participa de nenhum projeto
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {projects.map((project) => {
                            const isPinned = pinnedProjectIds.includes(project.id);

                            return (
                                <ListItem key={project.id} disablePadding>
                                    <ListItemButton
                                        onClick={() => handleToggle(project.id)}
                                        dense
                                    >
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={isPinned}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemIcon>
                                            <FolderOutlined sx={{ color: "primary.main" }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={project.name}
                                            secondary={`${project.member_count} membro${project.member_count !== 1 ? "s" : ""}`}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="contained">
                    Concluído
                </Button>
            </DialogActions>
        </Dialog>
    );
}
