import { useState, useEffect } from "react";
import { Avatar, Box, Paper, Stack, Typography, CircularProgress } from "@mui/material";
import { AssignmentOutlined, GroupOutlined, InsertChartOutlined, NotificationsNoneOutlined } from "@mui/icons-material";
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
};

type ChartData = {
    name: string;
    value: number;
    color?: string;
};

export default function Dashboard() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [stats, setStats] = useState({
        projetos: 0,
        tarefas: 0,
        equipes: 0,
        alertas: 0,
    });
    const [tasksByStatus, setTasksByStatus] = useState<ChartData[]>([]);
    const [tasksByPriority, setTasksByPriority] = useState<ChartData[]>([]);
    const [tasksByDeadline, setTasksByDeadline] = useState<ChartData[]>([]);
    const [tasksByProject, setTasksByProject] = useState<ChartData[]>([]);
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
            if (!token) return;

            try {
                setLoadingCharts(true);

                // Buscar projetos do usuário
                const projectsResponse = await api.get("/api/projects");
                const projects = Array.isArray(projectsResponse.data)
                    ? projectsResponse.data
                    : projectsResponse.data?.data || [];
                const projetos = projects.length;

                // Buscar equipes do usuário
                const teamsResponse = await api.get("/api/teams/my-teams");
                const teams = Array.isArray(teamsResponse.data)
                    ? teamsResponse.data
                    : teamsResponse.data?.data || [];
                const equipes = teams.length;

                // Buscar todas as tarefas do usuário em todos os projetos
                const allTasks: TaskData[] = [];
                const projectTaskCount: { [key: string]: number } = {};

                for (const project of projects) {
                    try {
                        const tasksResponse = await api.get(`/api/projects/${project.id}/cards`);
                        const tasks = tasksResponse.data?.cards || tasksResponse.data || [];

                        if (Array.isArray(tasks)) {
                            allTasks.push(...tasks);
                            projectTaskCount[project.name] = tasks.length;
                        }
                    } catch (error) {
                        console.error(`Erro ao buscar tarefas do projeto ${project.id}:`, error);
                    }
                }

                // Processar dados para gráficos
                processTasks(allTasks, projectTaskCount);

                // Buscar estatísticas de notificações
                const notificationsResponse = await api.get("/api/notifications/stats");
                const alertas = notificationsResponse.data?.unread || 0;

                setStats({ projetos, tarefas: allTasks.length, equipes, alertas });
            } catch (error) {
                console.error("Erro ao buscar estatísticas:", error);
            } finally {
                setLoadingCharts(false);
            }
        };
        fetchStats();
    }, []);

    // Processar tarefas e gerar dados para os gráficos
    const processTasks = (tasks: TaskData[], projectTaskCount: { [key: string]: number }) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Contadores
        let ativas = 0;
        let concluidas = 0;
        let arquivadas = 0;
        let vencidas = 0;
        let hojeVence = 0;
        let proximosSeteDias = 0;
        let futuras = 0;

        const priorityCount = { low: 0, medium: 0, high: 0, urgent: 0 };

        tasks.forEach((task) => {
            // Categorizar por status
            if (task.status === 'ACTIVE') ativas++;
            else if (task.status === 'COMPLETED') concluidas++;
            else if (task.status === 'ARCHIVED') arquivadas++;

            // Categorizar por prioridade
            if (task.priority) {
                const priority = task.priority.toLowerCase() as keyof typeof priorityCount;
                if (priorityCount[priority] !== undefined) {
                    priorityCount[priority]++;
                }
            }

            // Categorizar por prazo (apenas tarefas ativas)
            if (task.status === 'ACTIVE' && task.due_date) {
                const dueDate = new Date(task.due_date);
                dueDate.setHours(0, 0, 0, 0);
                const diffTime = dueDate.getTime() - hoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    vencidas++;
                } else if (diffDays === 0) {
                    hojeVence++;
                } else if (diffDays <= 7) {
                    proximosSeteDias++;
                } else {
                    futuras++;
                }
            }
        });

        // Dados para gráfico de status
        setTasksByStatus([
            { name: 'Ativas', value: ativas, color: '#8B6B47' },
            { name: 'Concluídas', value: concluidas, color: '#4CAF50' },
            { name: 'Arquivadas', value: arquivadas, color: '#9E9E9E' },
        ]);

        // Dados para gráfico de prioridade
        setTasksByPriority([
            { name: 'Baixa', value: priorityCount.low, color: '#81C784' },
            { name: 'Média', value: priorityCount.medium, color: '#FFB74D' },
            { name: 'Alta', value: priorityCount.high, color: '#FF8A65' },
            { name: 'Urgente', value: priorityCount.urgent, color: '#E57373' },
        ]);

        // Dados para gráfico de prazos
        setTasksByDeadline([
            { name: 'Vencidas', value: vencidas, color: '#E53935' },
            { name: 'Hoje', value: hojeVence, color: '#FB8C00' },
            { name: '7 dias', value: proximosSeteDias, color: '#FDD835' },
            { name: 'Futuras', value: futuras, color: '#43A047' },
        ]);

        // Dados para gráfico de tarefas por projeto
        const projectData = Object.entries(projectTaskCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 projetos
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

    // Cards de estatísticas com dados reais
    const statsCards = [
        {
            label: "Projetos",
            value: stats.projetos.toString(),
            auxiliary: stats.projetos > 0 ? "Meus projetos" : "Nenhum projeto ainda",
            icon: <InsertChartOutlined fontSize="small" />
        },
        {
            label: "Tarefas em aberto",
            value: stats.tarefas.toString(),
            auxiliary: stats.tarefas > 0 ? "Atribuídas a você" : "Nenhuma tarefa",
            icon: <AssignmentOutlined fontSize="small" />
        },
        {
            label: "Equipes",
            value: stats.equipes.toString(),
            auxiliary: stats.equipes > 0 ? "Você participa" : "Nenhuma equipe",
            icon: <GroupOutlined fontSize="small" />
        },
        {
            label: "Alertas",
            value: stats.alertas.toString(),
            auxiliary: stats.alertas > 0 ? "Notificações não lidas" : "Nenhum alerta",
            icon: <NotificationsNoneOutlined fontSize="small" />
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
                {statsCards.map((item) => (
                    <Paper key={item.label} sx={{ p: 3, borderRadius: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark", width: 40, height: 40 }}>
                                {item.icon}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                    {item.label}
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
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
                        {/* Gráfico de Status das Tarefas */}
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Status das Tarefas
                            </Typography>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={tasksByStatus}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
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

                        {/* Gráfico de Prioridades */}
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Tarefas por Prioridade
                            </Typography>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={tasksByPriority}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#666" style={{ fontSize: 12 }} />
                                    <YAxis stroke="#666" style={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0" }}
                                        labelStyle={{ fontWeight: 600 }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {tasksByPriority.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Box>

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
                        {/* Gráfico de Prazos */}
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Prazos das Tarefas Ativas
                            </Typography>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={tasksByDeadline}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#666" style={{ fontSize: 12 }} />
                                    <YAxis stroke="#666" style={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0" }}
                                        labelStyle={{ fontWeight: 600 }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {tasksByDeadline.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>

                        {/* Gráfico de Tarefas por Projeto */}
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Top 5 Projetos
                            </Typography>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={tasksByProject} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" stroke="#666" style={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" stroke="#666" style={{ fontSize: 12 }} width={100} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0" }}
                                        labelStyle={{ fontWeight: 600 }}
                                    />
                                    <Bar dataKey="value" fill="#8B6B47" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Box>
                </>
            )}
        </Box>
    );
}
