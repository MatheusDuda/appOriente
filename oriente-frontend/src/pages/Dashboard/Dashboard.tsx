import { useState, useEffect } from "react";
import { Avatar, Box, Paper, Stack, Typography, CircularProgress, Chip, List, ListItem, ListItemText, ListItemIcon, Divider } from "@mui/material";
import { AssignmentOutlined, WarningOutlined, CheckCircleOutlined, AccessTimeOutlined } from "@mui/icons-material";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { authService, type UserData } from "../../services/authService";
import api from "../../services/api";

type TaskData = {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date?: string;
    created_at: string;
    column_id: number;
    project_id?: number;
    project_name?: string;
};

type ChartData = {
    name: string;
    value: number;
    color?: string;
};

type TaskWithProject = TaskData & {
    project_name: string;
};

export default function Dashboard() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [tasksByStatus, setTasksByStatus] = useState<ChartData[]>([]);
    const [tasksByProject, setTasksByProject] = useState<ChartData[]>([]);
    const [statusCounts, setStatusCounts] = useState({ pendente: 0, andamento: 0, concluido: 0 });
    const [overdueTasks, setOverdueTasks] = useState<TaskWithProject[]>([]);
    const [urgentTasks, setUrgentTasks] = useState<TaskWithProject[]>([]);
    const [recentTasks, setRecentTasks] = useState<TaskWithProject[]>([]);
    const [loadingCharts, setLoadingCharts] = useState(true);

    // Buscar dados do usuário logado
    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("auth_token");
            if (!token) return;

            try {
                const user = await authService.getCurrentUser();
                setUserData(user);
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
            }
        };
        fetchUserData();
    }, []);

    // Buscar estatísticas e dados para gráficos
    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("auth_token");
            if (!token || !userData) return; // Aguardar userData estar carregado

            try {
                setLoadingCharts(true);

                // Buscar projetos do usuário
                const projectsResponse = await api.get("/api/projects");
                const projects = Array.isArray(projectsResponse.data)
                    ? projectsResponse.data
                    : projectsResponse.data?.data || [];

                // Buscar todas as tarefas do usuário em todos os projetos
                const allTasks: TaskWithProject[] = [];
                const projectTaskCount: { [key: string]: number } = {};

                for (const project of projects) {
                    try {
                        // Buscar tarefas do projeto
                        const tasksResponse = await api.get(`/api/projects/${project.id}/cards`);
                        let tasks = tasksResponse.data?.cards || tasksResponse.data || [];

                        if (Array.isArray(tasks)) {
                            // Filtrar apenas tarefas atribuídas ao usuário logado
                            const tasksForUser = tasks.filter((task: any) => {
                                if (!task.assignees || task.assignees.length === 0) return false;
                                // Verificar se o usuário atual está atribuído
                                return task.assignees.some((assignee: any) =>
                                    assignee.email === userData?.email || assignee.id === userData?.id
                                );
                            });

                            const tasksWithProject = tasksForUser.map((t: any) => ({
                                ...t,
                                project_name: project.name,
                                project_id: project.id
                            }));
                            allTasks.push(...tasksWithProject);
                            projectTaskCount[project.name] = tasksForUser.length;
                        }
                    } catch (error) {
                        console.error(`Erro ao buscar tarefas do projeto ${project.id}:`, error);
                    }
                }

                // Processar dados para gráficos
                processTasks(allTasks, projectTaskCount);
            } catch (error) {
                console.error("Erro ao buscar estatísticas:", error);
            } finally {
                setLoadingCharts(false);
            }
        };
        fetchStats();
    }, [userData]);

    // Processar tarefas e gerar dados para os gráficos
    const processTasks = (tasks: TaskWithProject[], projectTaskCount: { [key: string]: number }) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Contadores
        let pendente = 0;
        let andamento = 0;
        let concluidas = 0;
        let ativas = 0;
        let vencidas = 0;
        let hojeVence = 0;
        let proximosSeteDias = 0;
        let futuras = 0;

        const priorityCount = { low: 0, medium: 0, high: 0, urgent: 0 };
        const overdueTasksList: TaskWithProject[] = [];
        const urgentTasksList: TaskWithProject[] = [];

        tasks.forEach((task) => {
            // Categorizar por status (suportar both old e new status values)
            if (task.status === 'PENDING' || task.status === 'active') {
                pendente++;
                ativas++;
            } else if (task.status === 'IN_PROGRESS') {
                andamento++;
                ativas++;
            } else if (task.status === 'COMPLETED') {
                concluidas++;
            }

            // Categorizar por prioridade
            if (task.priority) {
                const priority = task.priority.toLowerCase() as keyof typeof priorityCount;
                if (priorityCount[priority] !== undefined) {
                    priorityCount[priority]++;
                }
            }

            // Tarefas urgentes (prioridade urgent ou high)
            if ((task.status === 'PENDING' || task.status === 'active' || task.status === 'IN_PROGRESS') &&
                (task.priority === 'urgent' || task.priority === 'high')) {
                urgentTasksList.push(task);
            }

            // Categorizar por prazo (apenas tarefas ativas - PENDING ou IN_PROGRESS ou active)
            if ((task.status === 'PENDING' || task.status === 'active' || task.status === 'IN_PROGRESS') && task.due_date) {
                const dueDate = new Date(task.due_date);
                dueDate.setHours(0, 0, 0, 0);
                const diffTime = dueDate.getTime() - hoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    vencidas++;
                    overdueTasksList.push(task);
                } else if (diffDays === 0) {
                    hojeVence++;
                } else if (diffDays <= 7) {
                    proximosSeteDias++;
                } else {
                    futuras++;
                }
            }
        });

        // Ordenar tarefas recentes (últimas criadas)
        const recentList = [...tasks]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
        setRecentTasks(recentList);

        // Definir contadores de status
        setStatusCounts({ pendente, andamento, concluido: concluidas });

        // Definir tarefas vencidas e urgentes
        setOverdueTasks(overdueTasksList.slice(0, 5));
        setUrgentTasks(urgentTasksList.slice(0, 5));

        // Dados para gráfico A2: Status das Tarefas (Pie)
        setTasksByStatus([
            { name: 'Pendente', value: pendente, color: '#FFA726' },
            { name: 'Em Andamento', value: andamento, color: '#42A5F5' },
            { name: 'Concluído', value: concluidas, color: '#66BB6A' },
        ]);

        // Dados para gráfico B2: Tarefas por Projeto (Bar Horizontal)
        const projectData = Object.entries(projectTaskCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        setTasksByProject(projectData);

    };

    // Obter saudação baseada no horário
    const getSaudacao = (): string => {
        const hora = new Date().getHours();
        if (hora < 12) return "Bom dia";
        if (hora < 18) return "Boa tarde";
        return "Boa noite";
    };

    // Obter primeiro nome do usuário
    const getPrimeiroNome = (name: string | undefined): string => {
        if (!name) return "Usuário";
        return name.trim().split(" ")[0];
    };

    // Formatar data para exibição
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    };

    // Obter dias restantes
    const getDaysRemaining = (dueDate: string | undefined): number | null => {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        const diff = due.getTime() - today.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // Cor de prioridade
    const getPriorityColor = (priority: string): "error" | "warning" | "info" | "success" => {
        switch (priority) {
            case "urgent":
            case "high":
                return "error";
            case "medium":
                return "warning";
            case "low":
                return "success";
            default:
                return "info";
        }
    };

    // Label de prioridade
    const getPriorityLabel = (priority: string): string => {
        switch (priority) {
            case "urgent":
                return "Urgente";
            case "high":
                return "Alta";
            case "medium":
                return "Média";
            case "low":
                return "Baixa";
            default:
                return priority;
        }
    };

    // Cards de estatísticas com dados reais
    const statsCards = [
        {
            label: "Pendentes",
            value: statusCounts.pendente.toString(),
            auxiliary: `${statusCounts.pendente} tarefa${statusCounts.pendente !== 1 ? 's' : ''}`,
            icon: <AssignmentOutlined fontSize="small" />,
            color: "#FFA726"
        },
        {
            label: "Em Andamento",
            value: statusCounts.andamento.toString(),
            auxiliary: `${statusCounts.andamento} tarefa${statusCounts.andamento !== 1 ? 's' : ''}`,
            icon: <AccessTimeOutlined fontSize="small" />,
            color: "#42A5F5"
        },
        {
            label: "Concluídos",
            value: statusCounts.concluido.toString(),
            auxiliary: `${statusCounts.concluido} tarefa${statusCounts.concluido !== 1 ? 's' : ''}`,
            icon: <CheckCircleOutlined fontSize="small" />,
            color: "#66BB6A"
        },
        {
            label: "Vencidas",
            value: overdueTasks.length.toString(),
            auxiliary: overdueTasks.length > 0 ? "Atenção necessária!" : "Tudo em dia",
            icon: <WarningOutlined fontSize="small" />,
            color: "#EF5350"
        },
    ];

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper
                sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 3,
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", md: "center" },
                    gap: 2.5,
                }}
            >
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {getSaudacao()}, {getPrimeiroNome(userData?.name)}!
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 420 }}>
                        Acompanhe os principais indicadores dos seus projetos e mantenha as equipes alinhadas com os objetivos do trimestre.
                    </Typography>
                </Box>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gap: 3,
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        xl: "repeat(4, minmax(0, 1fr))",
                    },
                }}
            >
                {statsCards.map((item: any) => (
                    <Paper key={item.label} sx={{ p: 3, borderRadius: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: item.color, color: "white", width: 40, height: 40 }}>
                                {item.icon}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                    {item.label}
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: item.color }}>
                                    {item.value}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    {item.auxiliary}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                ))}
            </Box>

            {loadingCharts ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Box
                        sx={{
                            display: "grid",
                            gap: 3,
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(2, minmax(0, 1fr))",
                            },
                        }}
                    >
                        {/* Gráfico A2: Status das Tarefas (Pie) */}
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                📊 Tarefas por Status
                            </Typography>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={tasksByStatus}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry: any) => `${entry.name}: ${entry.value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {tasksByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>

                        {/* Gráfico B2: Tarefas por Projeto (Bar Horizontal) */}
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                📁 Tarefas por Projeto
                            </Typography>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={tasksByProject} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" stroke="#666" style={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" stroke="#666" style={{ fontSize: 12 }} width={120} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0" }}
                                        labelStyle={{ fontWeight: 600 }}
                                    />
                                    <Bar dataKey="value" fill="#42A5F5" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Box>

                    {/* Tarefas Vencidas */}
                    {overdueTasks.length > 0 && (
                        <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#ffebee" }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#c62828" }}>
                                ⚠️ Tarefas Vencidas ({overdueTasks.length})
                            </Typography>
                            <List sx={{ p: 0 }}>
                                {overdueTasks.map((task, index) => (
                                    <Box key={task.id}>
                                        <ListItem sx={{ px: 0, py: 1.5 }}>
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <WarningOutlined sx={{ color: "#d32f2f" }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={task.title}
                                                secondary={`${task.project_name} • ${formatDate(task.due_date)}`}
                                                primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                                                secondaryTypographyProps={{ variant: "caption" }}
                                            />
                                            <Chip
                                                label={getPriorityLabel(task.priority)}
                                                size="small"
                                                color={getPriorityColor(task.priority)}
                                            />
                                        </ListItem>
                                        {index < overdueTasks.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        </Paper>
                    )}

                    {/* Tarefas Urgentes */}
                    {urgentTasks.length > 0 && (
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#d32f2f" }}>
                                🔴 Tarefas Urgentes/Altas ({urgentTasks.length})
                            </Typography>
                            <List sx={{ p: 0 }}>
                                {urgentTasks.map((task, index) => {
                                    const daysRemaining = getDaysRemaining(task.due_date);
                                    return (
                                        <Box key={task.id}>
                                            <ListItem sx={{ px: 0, py: 1.5 }}>
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    <AssignmentOutlined sx={{ color: "#d32f2f" }} />
                                                </ListItemIcon>
                                                <Box sx={{ flex: 1 }}>
                                                    <ListItemText
                                                        primary={task.title}
                                                        secondary={`${task.project_name} • ${daysRemaining !== null ? `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}` : 'Sem prazo'}`}
                                                        primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                                                        secondaryTypographyProps={{ variant: "caption" }}
                                                    />
                                                </Box>
                                                <Chip
                                                    label={getPriorityLabel(task.priority)}
                                                    size="small"
                                                    color={getPriorityColor(task.priority)}
                                                />
                                            </ListItem>
                                            {index < urgentTasks.length - 1 && <Divider />}
                                        </Box>
                                    );
                                })}
                            </List>
                        </Paper>
                    )}

                    {/* Tarefas Recentes */}
                    {recentTasks.length > 0 && (
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                📋 Últimas Tarefas Criadas
                            </Typography>
                            <List sx={{ p: 0 }}>
                                {recentTasks.map((task, index) => (
                                    <Box key={task.id}>
                                        <ListItem sx={{ px: 0, py: 1.5 }}>
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <AssignmentOutlined sx={{ color: "primary.main" }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={task.title}
                                                secondary={`${task.project_name} • ${formatDate(task.created_at)}`}
                                                primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                                                secondaryTypographyProps={{ variant: "caption" }}
                                            />
                                            <Chip
                                                label={getPriorityLabel(task.priority)}
                                                size="small"
                                                color={getPriorityColor(task.priority)}
                                            />
                                        </ListItem>
                                        {index < recentTasks.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        </Paper>
                    )}
                </>
            )}
        </Box>
    );
}
