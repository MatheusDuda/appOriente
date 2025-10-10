import { useState } from "react";
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
} from "@mui/material";
import {
    AddOutlined,
    MoreVertOutlined,
    FolderOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
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

type Task = {
    id: string;
    title: string;
    description: string;
    priority: "High" | "Medium" | "Low";
    assignees: { id: number; name: string; avatar?: string }[];
    dueDate?: string;
    tags?: string[];
    columnId: string;
};

type Column = {
    id: string;
    title: string;
};

type Project = {
    id: number;
    name: string;
};

const mockProjects: Project[] = [
    { id: 1, name: "Project Alpha" },
    { id: 2, name: "Project Beta" },
    { id: 3, name: "Project Gamma" },
];

const mockColumns: Column[] = [
    { id: "col-1", title: "To Do" },
    { id: "col-2", title: "In Progress" },
    { id: "col-3", title: "Review" },
    { id: "col-4", title: "Done" },
];

const mockTasks: Task[] = [
    {
        id: "task-1",
        columnId: "col-1",
        title: "Implement authentication",
        description: "Create JWT login system",
        priority: "High",
        assignees: [
            { id: 1, name: "John Silva" },
            { id: 2, name: "Mary Santos" },
        ],
        dueDate: "2025-10-15",
        tags: ["Backend", "Security"],
    },
    {
        id: "task-2",
        columnId: "col-1",
        title: "Dashboard design",
        description: "Create wireframes and mockups",
        priority: "Medium",
        assignees: [{ id: 3, name: "Ana Oliveira" }],
        dueDate: "2025-10-12",
        tags: ["Design", "UI/UX"],
    },
    {
        id: "task-3",
        columnId: "col-2",
        title: "User API",
        description: "Develop CRUD endpoints",
        priority: "High",
        assignees: [{ id: 4, name: "Carlos Lima" }],
        tags: ["Backend", "API"],
    },
    {
        id: "task-4",
        columnId: "col-3",
        title: "Technical documentation",
        description: "Update README and API docs",
        priority: "Low",
        assignees: [{ id: 5, name: "Pedro Costa" }],
        tags: ["Documentation"],
    },
    {
        id: "task-5",
        columnId: "col-4",
        title: "Initial project setup",
        description: "Configure repository and CI/CD",
        priority: "High",
        assignees: [
            { id: 1, name: "John Silva" },
            { id: 4, name: "Carlos Lima" },
        ],
        tags: ["DevOps"],
    },
];

const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
        case "High":
            return "error";
        case "Medium":
            return "warning";
        case "Low":
            return "success";
        default:
            return "default";
    }
};

function TaskCard({ task, onClickTask }: { task: Task; onClickTask: (id: string) => void }) {
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

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                    {task.tags?.map((tag) => (
                        <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                    ))}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority)}
                        size="small"
                        sx={{ height: 22, fontSize: "0.7rem" }}
                    />

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
                </Box>

                {task.dueDate && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            color: "text.secondary",
                            mt: 1,
                            fontSize: "0.7rem",
                        }}
                    >
                        Due: {new Date(task.dueDate).toLocaleDateString("en-US")}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

export default function Projects() {
    const navigate = useNavigate();
    const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
    const [columns, setColumns] = useState<Column[]>(mockColumns);
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [newColumnDialogOpen, setNewColumnDialogOpen] = useState(false);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Precisa arrastar 8px para ativar o drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
        handleCloseMenu();
    };

    const handleAddColumn = (title: string) => {
        const newColumn: Column = {
            id: `col-${Date.now()}`,
            title,
        };
        setColumns([...columns, newColumn]);
    };

    const handleAddTask = (newTask: {
        title: string;
        description: string;
        priority: "High" | "Medium" | "Low";
        assignees: number[];
        dueDate?: string;
        tags: string[];
        columnId: string;
    }) => {
        const task: Task = {
            id: `task-${Date.now()}`,
            ...newTask,
            assignees: newTask.assignees.map((id) => ({
                id,
                name: mockMembers.find((m) => m.id === id)?.name || "",
            })),
        };
        setTasks([...tasks, task]);
    };

    const handleClickTask = (taskId: string) => {
        navigate(`/tarefas/${taskId}`);
    };

    const mockMembers = [
        { id: 1, name: "John Silva" },
        { id: 2, name: "Mary Santos" },
        { id: 3, name: "Pedro Costa" },
        { id: 4, name: "Ana Oliveira" },
        { id: 5, name: "Carlos Lima" },
    ];

    const findContainer = (id: string) => {
        if (tasks.find((t) => t.id === id)) {
            return tasks.find((t) => t.id === id)?.columnId;
        }
        return id;
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) return;

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;
        if (activeContainer === overContainer) return;

        setTasks((prev) => {
            return prev.map((task) => {
                if (task.id === activeId) {
                    return { ...task, columnId: overContainer };
                }
                return task;
            });
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;

        if (activeContainer === overContainer) {
            const items = tasks.filter((t) => t.columnId === activeContainer);
            const oldIndex = items.findIndex((t) => t.id === activeId);
            const newIndex = items.findIndex((t) => t.id === overId);

            if (oldIndex !== newIndex) {
                const newItems = arrayMove(items, oldIndex, newIndex);
                setTasks((prev) => {
                    const otherItems = prev.filter((t) => t.columnId !== activeContainer);
                    return [...otherItems, ...newItems];
                });
            }
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, height: "calc(100vh - 120px)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton
                        onClick={handleOpenMenu}
                        sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            "&:hover": { bgcolor: "primary.dark" },
                        }}
                    >
                        <FolderOutlined />
                    </IconButton>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {selectedProject.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Task board
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AddOutlined />}
                        onClick={() => setNewColumnDialogOpen(true)}
                    >
                        New Column
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddOutlined />}
                        onClick={() => setCreateTaskDialogOpen(true)}
                    >
                        New Task
                    </Button>
                </Box>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                {mockProjects.map((project) => (
                    <MenuItem
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        selected={project.id === selectedProject.id}
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
                        Create New Project
                    </Box>
                </MenuItem>
            </Menu>

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
                    {columns.map((column) => {
                        const columnTasks = tasks.filter((t) => t.columnId === column.id);

                        return (
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
                                            label={columnTasks.length}
                                            size="small"
                                            sx={{ height: 20, fontSize: "0.75rem" }}
                                        />
                                    </Box>
                                    <IconButton size="small">
                                        <MoreVertOutlined fontSize="small" />
                                    </IconButton>
                                </Box>

                                <SortableContext
                                    items={columnTasks.map((t) => t.id)}
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
                                        {columnTasks.map((task) => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                onClickTask={handleClickTask}
                                            />
                                        ))}
                                    </Box>
                                </SortableContext>
                            </Paper>
                        );
                    })}
                </Box>
            </DndContext>

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
            />
        </Box>
    );
}
