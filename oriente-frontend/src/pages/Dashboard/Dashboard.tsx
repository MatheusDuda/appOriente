import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Box, Paper, Stack, Typography, Chip, List, ListItem, ListItemText, ListItemIcon, Divider } from "@mui/material";
import { AssignmentOutlined, WarningOutlined, CheckCircleOutlined, AccessTimeOutlined } from "@mui/icons-material";
import { authService, type UserData } from "../../services/authService";
import api from "../../services/api";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type TaskData = {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date?: string;
    completed_at?: string;
    created_at: string;
    column_id: number;
    project_id?: number;
    project_name?: string;
};

type TaskWithProject = TaskData & {
    project_name: string;
};

export default function Dashboard() {
    const navigate = useNavigate();
    const abortControllerRef = useRef<AbortController | null>(null);
    const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [userData, setUserData] = useState<UserData | null>(null);
    const [statusCounts, setStatusCounts] = useState({ pendente: 0, andamento: 0, concluido: 0 });
    const [overdueTasks, setOverdueTasks] = useState<TaskWithProject[]>([]);
    const [urgentTasks, setUrgentTasks] = useState<TaskWithProject[]>([]);
    const [recentTasks, setRecentTasks] = useState<TaskWithProject[]>([]);
    const [taskStatusData, setTaskStatusData] = useState<Array<{ name: string; value: number; fill: string }>>([]);
    const [taskPriorityData, setTaskPriorityData] = useState<Array<{ name: string; value: number; fill: string }>>([]);

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

    // Processar tarefas e gerar dados para os gráficos
    const processTasks = useCallback((tasks: TaskWithProject[], columnMap?: { [projectId: number]: { pending: number | null; inProgress: number[]; completed: number | null } }) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        console.log("Processando tarefas:", tasks);

        // Contadores
        let pendente = 0;
        let andamento = 0;
        let concluidas = 0;
        let urgentCount = 0;
        let highCount = 0;
        let mediumCount = 0;
        let lowCount = 0;

        const overdueTasksList: TaskWithProject[] = [];
        const urgentTasksList: TaskWithProject[] = [];

        tasks.forEach((task) => {
            // DEBUG: Log cada tarefa para ver seus campos
            console.log(`Tarefa: ${task.title}`, {
                id: task.id,
                project_id: task.project_id,
                status: task.status,
                completed_at: task.completed_at,
                column_id: task.column_id,
                priority: task.priority
            });

            // Obter os column_ids especiais do projeto
            const projectColumnIds = columnMap ? columnMap[task.project_id || 0] : null;
            const pendingColumnId = projectColumnIds?.pending;
            const inProgressColumnIds = projectColumnIds?.inProgress || [];
            const completedColumnId = projectColumnIds?.completed;

            // Determinar status baseado no column_id
            const isConcluded = completedColumnId && task.column_id === completedColumnId;
            const isInProgress = inProgressColumnIds.includes(task.column_id);
            const isPending = pendingColumnId && task.column_id === pendingColumnId;

            console.log(`  Pendente col: ${pendingColumnId}, Em Andamento cols: ${inProgressColumnIds}, Concluído col: ${completedColumnId}, Task col: ${task.column_id}`);
            console.log(`  Status: Pendente=${isPending}, Em Andamento=${isInProgress}, Concluída=${isConcluded}`);

            if (isConcluded) {
                concluidas++;
                console.log(`  ✓ Contando como CONCLUÍDA`);
            } else if (isInProgress) {
                andamento++;
                console.log(`  ⏳ Contando como EM ANDAMENTO`);
            } else if (isPending) {
                pendente++;
                console.log(`  → Contando como PENDENTE`);
            } else {
                // Fallback: se não conseguiu identificar, contar como pendente
                pendente++;
                console.log(`  → Contando como PENDENTE (fallback)`);
            }

            // Contar por prioridade (apenas tarefas ativas - não concluídas)
            if (!isConcluded && task.priority) {
                const priority = task.priority.toLowerCase();
                switch (priority) {
                    case 'urgent':
                        urgentCount++;
                        break;
                    case 'high':
                        highCount++;
                        break;
                    case 'medium':
                        mediumCount++;
                        break;
                    case 'low':
                        lowCount++;
                        break;
                }
            }

            // Categorizar por prioridade (apenas tarefas não concluídas)
            if (task.priority && !isConcluded) {
                const priority = task.priority.toLowerCase();
                // Tarefas urgentes (prioridade urgent ou high)
                if (priority === 'urgent' || priority === 'high') {
                    urgentTasksList.push(task);
                }
            }

            // Tarefas vencidas (apenas tarefas não concluídas)
            if (!isConcluded && task.due_date) {
                const dueDate = new Date(task.due_date);
                dueDate.setHours(0, 0, 0, 0);
                const diffTime = dueDate.getTime() - hoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    overdueTasksList.push(task);
                }
            }
        });

        console.log("Contadores:", { pendente, andamento, concluidas });
        console.log("Tarefas vencidas:", overdueTasksList);
        console.log("Tarefas urgentes:", urgentTasksList);
        console.log("Contadores de prioridade:", { urgentCount, highCount, mediumCount, lowCount });

        // Definir contadores de status
        setStatusCounts({ pendente, andamento, concluido: concluidas });

        // Definir dados para gráfico de status (rosquinha)
        const statusChartData = [
            { name: "Pendente", value: pendente, fill: "#FFA726" },
            { name: "Em Andamento", value: andamento, fill: "#42A5F5" },
            { name: "Concluído", value: concluidas, fill: "#66BB6A" }
        ].filter(item => item.value > 0);
        setTaskStatusData(statusChartData);

        // Definir dados para gráfico de prioridade (barra)
        const priorityChartData = [
            { name: "Urgente", value: urgentCount, fill: "#EF5350" },
            { name: "Alta", value: highCount, fill: "#FF9800" },
            { name: "Média", value: mediumCount, fill: "#FDD835" },
            { name: "Baixa", value: lowCount, fill: "#90A4AE" }
        ].filter(item => item.value > 0);
        setTaskPriorityData(priorityChartData);

        // Definir tarefas vencidas e urgentes
        setOverdueTasks(overdueTasksList.slice(0, 5));
        setUrgentTasks(urgentTasksList.slice(0, 5));

    }, []);

    // Função reutilizável para buscar estatísticas
    const fetchStats = useCallback(async () => {
        const token = localStorage.getItem("auth_token");
        if (!token || !userData) return; // Aguardar userData estar carregado

        // Cancelar requisição anterior se existir
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            // Buscar projetos do usuário
            const projectsResponse = await api.get("/api/projects", {
                signal: abortControllerRef.current.signal
            });
            const projects = Array.isArray(projectsResponse.data)
                ? projectsResponse.data
                : projectsResponse.data?.data || [];

            // Mapa para armazenar os column_ids especiais de cada projeto
            const columnIdsMap: {
                [projectId: number]: {
                    pending: number | null;
                    inProgress: number[];
                    completed: number | null
                }
            } = {};

            // Buscar colunas de cada projeto para identificar "Pendente", "Em Andamento" e "Concluído"
            for (const project of projects) {
                try {
                    const columnsResponse = await api.get(`/api/projects/${project.id}/columns`, {
                        signal: abortControllerRef.current.signal
                    });
                    const columns = columnsResponse.data?.columns || columnsResponse.data || [];

                    let pendingColumnId: number | null = null;
                    let inProgressColumnIds: number[] = [];
                    let completedColumnId: number | null = null;

                    if (Array.isArray(columns) && columns.length > 0) {
                        // Log de todas as colunas para debug
                        console.log(`Colunas do projeto ${project.name}:`, columns);

                        // Lógica: primeira coluna = pendente, última = concluído, as do meio = em andamento
                        pendingColumnId = columns[0].id;
                        completedColumnId = columns[columns.length - 1].id;

                        // Colunas do meio são "em andamento"
                        if (columns.length > 2) {
                            inProgressColumnIds = columns.slice(1, columns.length - 1).map((col: any) => col.id);
                        }

                        console.log(`Projeto ${project.name}: Pendente=${pendingColumnId}, Em Andamento=${inProgressColumnIds}, Concluído=${completedColumnId}`);
                    }

                    columnIdsMap[project.id] = {
                        pending: pendingColumnId,
                        inProgress: inProgressColumnIds,
                        completed: completedColumnId
                    };
                } catch (error) {
                    // Se falhar, não ter colunas especiais
                    columnIdsMap[project.id] = {
                        pending: null,
                        inProgress: [],
                        completed: null
                    };
                }
            }

            // Buscar todas as tarefas do usuário em todos os projetos
            const allTasks: TaskWithProject[] = [];
            const userTasks: TaskWithProject[] = []; // Apenas tarefas atribuídas ao usuário

            for (const project of projects) {
                try {
                    // Buscar tarefas do projeto
                    const tasksResponse = await api.get(`/api/projects/${project.id}/cards`, {
                        signal: abortControllerRef.current.signal
                    });
                    let tasks = tasksResponse.data?.cards || tasksResponse.data || [];

                    if (Array.isArray(tasks)) {
                        // DEBUG: Log dos campos da primeira tarefa
                        if (tasks.length > 0) {
                            console.log(`DEBUG: Primeira tarefa do projeto ${project.name}:`, tasks[0]);
                        }

                        // TODAS as tarefas com projeto info (para listar)
                        const tasksWithProject = tasks.map((t: any) => ({
                            ...t,
                            project_name: project.name,
                            project_id: project.id
                        }));
                        allTasks.push(...tasksWithProject);

                        // APENAS tarefas atribuídas ao usuário (para contadores)
                        const userAssignedTasks = tasksWithProject.filter((task: any) => {
                            if (!task.assignees || task.assignees.length === 0) return false;
                            return task.assignees.some((assignee: any) =>
                                assignee.email === userData?.email || assignee.id === userData?.id
                            );
                        });
                        userTasks.push(...userAssignedTasks);
                    }
                } catch (error) {
                    // Ignorar erro de AbortController e erros de cancelamento
                    if ((error as any).name !== 'AbortError' && (error as any).code !== 'ERR_CANCELED') {
                        console.error(`Erro ao buscar tarefas do projeto ${project.id}:`, error);
                    }
                }
            }

            console.log("Todas as tarefas (para listar):", allTasks);
            console.log("Tarefas do usuário (para contadores):", userTasks);
            console.log("Mapa de colunas:", columnIdsMap);

            // Processar dados para gráficos (usando apenas tarefas do usuário)
            processTasks(userTasks, columnIdsMap);

            // Atualizar listas de tarefas recentes com APENAS tarefas do usuário
            const recentListUser = [...userTasks]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);
            setRecentTasks(recentListUser);
        } catch (error) {
            // Ignorar erro de AbortController e erros de cancelamento
            if ((error as any).name !== 'AbortError' && (error as any).code !== 'ERR_CANCELED') {
                console.error("Erro ao buscar estatísticas:", error);
            }
        } finally {
            // Nothing to clean up
        }
    }, [userData, processTasks]);

    // Buscar estatísticas e dados para gráficos - Primeira vez
    useEffect(() => {
        if (userData) {
            fetchStats();
        }
    }, [userData, fetchStats]);

    // Setup polling automático a cada 30 segundos
    useEffect(() => {
        if (!userData) return;

        // Fazer fetch inicial
        fetchStats();

        // Configurar polling
        pollingIntervalRef.current = setInterval(() => {
            fetchStats(); // Fazer fetch a cada 30 segundos
        }, 30000); // 30 segundos

        // Cleanup ao desmontar
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [userData, fetchStats]);

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

    // Navegar para a tarefa detalhada
    const handleTaskClick = (task: TaskWithProject) => {
        if (task.project_id) {
            navigate(`/projetos/${task.project_id}/tarefas/${task.id}`);
        }
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

            {/* Gráficos de Análise */}
            {(taskStatusData.length > 0 || taskPriorityData.length > 0) && (
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
                    {/* Gráfico de Rosquinha - Status das Tarefas */}
                    {taskStatusData.length > 0 && (
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                📊 Status das Tarefas
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={taskStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {taskStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} tarefa${value !== 1 ? 's' : ''}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    )}

                    {/* Gráfico de Barra - Tarefas por Prioridade */}
                    {taskPriorityData.length > 0 && (
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                🎯 Tarefas por Prioridade
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={taskPriorityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `${value} tarefa${value !== 1 ? 's' : ''}`} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {taskPriorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    )}
                </Box>
            )}

            {/* Tarefas Vencidas */}
            {overdueTasks.length > 0 && (
                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "#ffebee" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#c62828" }}>
                        ⚠️ Tarefas Vencidas ({overdueTasks.length})
                    </Typography>
                    <List sx={{ p: 0 }}>
                        {overdueTasks.map((task, index) => (
                            <Box key={task.id}>
                                <ListItem
                                    onClick={() => handleTaskClick(task)}
                                    sx={{
                                        px: 0,
                                        py: 1.5,
                                        cursor: "pointer",
                                        transition: "background-color 0.2s",
                                        "&:hover": {
                                            backgroundColor: "rgba(211, 47, 47, 0.08)",
                                            borderRadius: 1,
                                            px: 1,
                                        }
                                    }}
                                >
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
                                    <ListItem
                                        onClick={() => handleTaskClick(task)}
                                        sx={{
                                            px: 0,
                                            py: 1.5,
                                            cursor: "pointer",
                                            transition: "background-color 0.2s",
                                            "&:hover": {
                                                backgroundColor: "rgba(211, 47, 47, 0.08)",
                                                borderRadius: 1,
                                                px: 1,
                                            }
                                        }}
                                    >
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
                                <ListItem
                                    onClick={() => handleTaskClick(task)}
                                    sx={{
                                        px: 0,
                                        py: 1.5,
                                        cursor: "pointer",
                                        transition: "background-color 0.2s",
                                        "&:hover": {
                                            backgroundColor: "rgba(66, 165, 245, 0.08)",
                                            borderRadius: 1,
                                            px: 1,
                                        }
                                    }}
                                >
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
        </Box>
    );
}
