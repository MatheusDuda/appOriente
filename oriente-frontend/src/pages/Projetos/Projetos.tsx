import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Button,
    IconButton,
    Chip,
    Avatar,
    AvatarGroup,
    Menu,
    MenuItem,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material";
import {
    AddOutlined,
    MoreVertOutlined,
    FolderOutlined,
    ArrowDropDown,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import NewColumnDialog from "../../components/Projetos/NewColumnDialog";
import CreateTask from "../../components/Tarefas/CreateTask";
import type {
    Card as CardType,
    KanbanColumn,
    ProjectSummary,
} from "../../types";
import { CardPriority } from "../../types";
import projectService from "../../services/projectService";

const getPriorityColor = (priority: CardPriority) => {
    switch (priority) {
        case CardPriority.URGENT:
        case CardPriority.HIGH:
            return "error";
        case CardPriority.MEDIUM:
            return "warning";
        case CardPriority.LOW:
            return "success";
        default:
            return "default";
    }
};

const getPriorityLabel = (priority: CardPriority) => {
    switch (priority) {
        case CardPriority.URGENT:
            return "Urgente";
        case CardPriority.HIGH:
            return "Alta";
        case CardPriority.MEDIUM:
            return "Média";
        case CardPriority.LOW:
            return "Baixa";
        default:
            return "Média";
    }
};

function TaskCard({ task, onClickTask }: { task: CardType; onClickTask: (id: number) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleClick = (e: React.MouseEvent) => {
        // Don't open if clicking on options menu
        if ((e.target as HTMLElement).closest('[data-menu-trigger]')) {
            return;
        }
        onClickTask(task.id);
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleClick}
            sx={{
                mb: 2,
                borderRadius: 1.5,
                cursor: "grab",
                boxShadow: 1,
                "&:hover": {
                    boxShadow: 3,
                },
                "&:active": {
                    cursor: "grabbing",
                },
            }}
        >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                        {task.title}
                    </Typography>
                    <IconButton size="small" sx={{ ml: 1, mt: -0.5 }} data-menu-trigger>
                        <MoreVertOutlined fontSize="small" />
                    </IconButton>
                </Box>

                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5, fontSize: "0.8125rem" }}>
                    {task.description}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip
                        label={getPriorityLabel(task.priority)}
                        color={getPriorityColor(task.priority)}
                        size="small"
                        sx={{ height: 22, fontSize: "0.7rem" }}
                    />

                    {task.assignees && task.assignees.length > 0 && (
                        <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 24, height: 24, fontSize: "0.75rem" } }}>
                            {task.assignees.map((assignee) => (
                                <Avatar
                                    key={assignee.id}
                                    sx={{ bgcolor: "primary.main" }}
                                    title={assignee.name}
                                >
                                    {assignee.name.charAt(0)}
                                </Avatar>
                            ))}
                        </AvatarGroup>
                    )}
                </Box>

                {task.due_date && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            color: "text.secondary",
                            mt: 1,
                            fontSize: "0.7rem",
                        }}
                    >
                        Vencimento: {new Date(task.due_date).toLocaleDateString("pt-BR")}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

export default function Projects() {
    const navigate = useNavigate();
    const location = useLocation();
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [newColumnDialogOpen, setNewColumnDialogOpen] = useState(false);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

    // Loading states
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingBoard, setLoadingBoard] = useState(false);

    console.log("Projects component rendered", { loadingProjects, projects: projects.length });

    // Error handling
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadProjects = useCallback(async (autoSelectFirst = true) => {
        try {
            setLoadingProjects(true);
            console.log("Carregando projetos...");
            const data = await projectService.getProjects();
            console.log("Projetos carregados:", data);
            setProjects(data);

            // Auto-select first project if available and none is selected
            if (autoSelectFirst && data.length > 0) {
                setSelectedProject((current) => {
                    if (!current) {
                        console.log("Auto-selecionando primeiro projeto:", data[0]);
                        return data[0];
                    }
                    return current;
                });
            }
        } catch (error: any) {
            console.error("Erro ao carregar projetos:", error);
            setProjects([]); // Set empty array to show empty state
            setSnackbar({
                open: true,
                message: error?.response?.data?.detail || "Erro ao carregar projetos",
                severity: "error",
            });
        } finally {
            setLoadingProjects(false);
        }
    }, []);

    // Load projects on mount and restore selected project from localStorage
    useEffect(() => {
        console.log("useEffect (mount) - Carregando projetos iniciais");
        loadProjects(false); // Don't auto-select first

        // Restore selected project from localStorage
        const savedProjectId = localStorage.getItem("selectedProjectId");
        if (savedProjectId) {
            // Will be set after projects load
            console.log("Projeto salvo encontrado:", savedProjectId);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Restore selected project after projects are loaded
    useEffect(() => {
        if (projects.length > 0 && !selectedProject) {
            const savedProjectId = localStorage.getItem("selectedProjectId");
            if (savedProjectId) {
                const project = projects.find(p => p.id === parseInt(savedProjectId));
                if (project) {
                    console.log("Restaurando projeto selecionado:", project);
                    setSelectedProject(project);
                    return;
                }
            }
            // If no saved project or not found, select first
            console.log("Selecionando primeiro projeto:", projects[0]);
            setSelectedProject(projects[0]);
        }
    }, [projects, selectedProject]);

    // Save selected project to localStorage
    useEffect(() => {
        if (selectedProject) {
            console.log("Salvando projeto selecionado:", selectedProject.id);
            localStorage.setItem("selectedProjectId", selectedProject.id.toString());
        }
    }, [selectedProject]);

    // Reload projects when returning from create page
    useEffect(() => {
        if (location.state) {
            console.log("useEffect (location.state) - location.state mudou:", location.state);
            loadProjects();
        }
    }, [location.state, loadProjects]);

    // Load board when project is selected
    useEffect(() => {
        if (selectedProject) {
            loadProjectBoard(selectedProject.id);
        }
    }, [selectedProject]);

    const loadProjectBoard = async (projectId: number) => {
        try {
            setLoadingBoard(true);
            const board = await projectService.getProjectBoard(projectId);
            setColumns(board.board);
        } catch (error) {
            setSnackbar({
                open: true,
                message: "Erro ao carregar board do projeto",
                severity: "error",
            });
        } finally {
            setLoadingBoard(false);
        }
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleSelectProject = (project: ProjectSummary) => {
        setSelectedProject(project);
        handleCloseMenu();
    };

    const handleAddColumn = async (title: string, color?: string) => {
        if (!selectedProject) return;

        try {
            const newColumn = await projectService.createColumn(selectedProject.id, {
                title,
                color,
                position: columns.length,
            });

            setColumns([...columns, newColumn]);
            setSnackbar({
                open: true,
                message: "Coluna criada com sucesso",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: "Erro ao criar coluna",
                severity: "error",
            });
        }
    };

    const handleAddTask = async (newTask: {
        title: string;
        description: string;
        priority: CardPriority;
        assignees: number[];
        dueDate?: string;
        columnId: number;
    }) => {
        if (!selectedProject) return;

        try {
            const createdCard = await projectService.createCard(selectedProject.id, {
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                column_id: newTask.columnId,
                due_date: newTask.dueDate,
                assignee_ids: newTask.assignees,
            });

            // Update the column with the new card
            setColumns((prevColumns) =>
                prevColumns.map((col) =>
                    col.id === newTask.columnId
                        ? { ...col, cards: [...col.cards, createdCard] }
                        : col
                )
            );

            setSnackbar({
                open: true,
                message: "Tarefa criada com sucesso",
                severity: "success",
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: "Erro ao criar tarefa",
                severity: "error",
            });
        }
    };

    const handleClickTask = (taskId: number) => {
        if (!selectedProject) return;
        navigate(`/projetos/${selectedProject.id}/tarefas/${taskId}`);
    };

    const findContainer = (id: number) => {
        for (const column of columns) {
            if (column.cards.find((card) => card.id === id)) {
                return column.id;
            }
        }
        return null;
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = Number(active.id);
        const overId = Number(over.id);

        if (activeId === overId) return;

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;
        if (activeContainer === overContainer) return;

        setColumns((prevColumns) => {
            return prevColumns.map((column) => {
                if (column.id === activeContainer) {
                    return {
                        ...column,
                        cards: column.cards.filter((card) => card.id !== activeId),
                    };
                }
                if (column.id === overContainer) {
                    const activeCard = prevColumns
                        .find((col) => col.id === activeContainer)
                        ?.cards.find((card) => card.id === activeId);

                    if (activeCard) {
                        return {
                            ...column,
                            cards: [...column.cards, { ...activeCard, column_id: overContainer }],
                        };
                    }
                }
                return column;
            });
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !selectedProject) return;

        const activeId = Number(active.id);
        const overId = Number(over.id);

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;

        // Find the card and its new position
        const targetColumn = columns.find((col) => col.id === overContainer);
        if (!targetColumn) return;

        const activeCard = columns
            .flatMap((col) => col.cards)
            .find((card) => card.id === activeId);

        if (!activeCard) return;

        // Calculate new position
        const overIndex = targetColumn.cards.findIndex((card) => card.id === overId);
        const newPosition = overIndex >= 0 ? overIndex : targetColumn.cards.length;

        try {
            // Call API to move card
            await projectService.moveCard(selectedProject.id, activeId, {
                column_id: overContainer,
                position: newPosition,
            });

            // If moving within the same column, reorder
            if (activeContainer === overContainer) {
                const items = targetColumn.cards;
                const oldIndex = items.findIndex((card) => card.id === activeId);
                const newIndex = items.findIndex((card) => card.id === overId);

                if (oldIndex !== newIndex) {
                    const newItems = arrayMove(items, oldIndex, newIndex);
                    setColumns((prevColumns) =>
                        prevColumns.map((col) =>
                            col.id === activeContainer
                                ? { ...col, cards: newItems }
                                : col
                        )
                    );
                }
            }

            setSnackbar({
                open: true,
                message: "Tarefa movida com sucesso",
                severity: "success",
            });
        } catch (error) {
            // Revert on error - reload board
            if (selectedProject) {
                loadProjectBoard(selectedProject.id);
            }
            setSnackbar({
                open: true,
                message: "Erro ao mover tarefa",
                severity: "error",
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (loadingProjects) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (projects.length === 0) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, mt: 8 }}>
                <Typography variant="h5" color="text.secondary">
                    Nenhum projeto encontrado
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddOutlined />}
                    onClick={() => navigate("/projetos/novo")}
                >
                    Criar Primeiro Projeto
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, height: "calc(100vh - 120px)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton
                        sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            "&:hover": { bgcolor: "primary.dark" },
                        }}
                    >
                        <FolderOutlined />
                    </IconButton>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {selectedProject?.name || "Selecione um projeto"}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Quadro de Tarefas
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={handleOpenMenu}
                            size="small"
                            sx={{ ml: 0.5 }}
                        >
                            <ArrowDropDown />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AddOutlined />}
                        onClick={() => setNewColumnDialogOpen(true)}
                        disabled={!selectedProject}
                    >
                        Nova Coluna
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddOutlined />}
                        onClick={() => setCreateTaskDialogOpen(true)}
                        disabled={!selectedProject}
                    >
                        Nova Tarefa
                    </Button>
                </Box>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                {projects.map((project) => (
                    <MenuItem
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        selected={project.id === selectedProject?.id}
                    >
                        {project.name}
                    </MenuItem>
                ))}
                <MenuItem
                    onClick={() => {
                        handleCloseMenu();
                        navigate("/projetos/novo");
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "primary.main" }}>
                        <AddOutlined fontSize="small" />
                        Criar Novo Projeto
                    </Box>
                </MenuItem>
            </Menu>

            {loadingBoard ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                    <CircularProgress />
                </Box>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                >
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            overflowX: "auto",
                            pb: 2,
                            height: "100%",
                        }}
                    >
                        {columns.map((column) => (
                            <Paper
                                key={column.id}
                                sx={{
                                    minWidth: 320,
                                    maxWidth: 320,
                                    display: "flex",
                                    flexDirection: "column",
                                    borderRadius: 2,
                                    bgcolor: "grey.50",
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {column.title}
                                        </Typography>
                                        <Chip
                                            label={column.cards.length}
                                            size="small"
                                            sx={{ height: 20, fontSize: "0.75rem" }}
                                        />
                                    </Box>
                                    <IconButton size="small">
                                        <MoreVertOutlined fontSize="small" />
                                    </IconButton>
                                </Box>

                                <SortableContext
                                    items={column.cards.map((card) => card.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <Box
                                        sx={{
                                            p: 2,
                                            flexGrow: 1,
                                            overflowY: "auto",
                                            minHeight: 200,
                                        }}
                                    >
                                        {column.cards.map((card) => (
                                            <TaskCard
                                                key={card.id}
                                                task={card}
                                                onClickTask={handleClickTask}
                                            />
                                        ))}
                                    </Box>
                                </SortableContext>
                            </Paper>
                        ))}
                    </Box>
                </DndContext>
            )}

            <NewColumnDialog
                open={newColumnDialogOpen}
                onClose={() => setNewColumnDialogOpen(false)}
                onSave={handleAddColumn}
            />

            <CreateTask
                open={createTaskDialogOpen}
                onClose={() => setCreateTaskDialogOpen(false)}
                onSave={handleAddTask}
                columns={columns}
                projectId={selectedProject?.id}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
