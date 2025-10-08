import { Fragment } from "react";
import { Avatar, Box, Button, Chip, Divider, LinearProgress, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { ArrowForwardOutlined, AssignmentOutlined, GroupOutlined, InsertChartOutlined, NotificationsNoneOutlined } from "@mui/icons-material";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const stats = [
    { label: "Projetos ativos", value: "12", auxiliary: "+3 este mes", icon: <InsertChartOutlined fontSize="small" /> },
    { label: "Tarefas em aberto", value: "48", auxiliary: "15 com vencimento hoje", icon: <AssignmentOutlined fontSize="small" /> },
    { label: "Equipes", value: "6", auxiliary: "2 novas semana passada", icon: <GroupOutlined fontSize="small" /> },
    { label: "Alertas", value: "5", auxiliary: "3 pendentes", icon: <NotificationsNoneOutlined fontSize="small" /> },
];

const upcoming = [
    { title: "Reuniao com equipe Atlas", subtitle: "Hoje, 14:00", chip: "Reuniao" },
    { title: "Entrega sprint Projeto Aurora", subtitle: "Amanha, 10:00", chip: "Entrega" },
    { title: "Revisao indicadores trimestrais", subtitle: "Quarta, 09:30", chip: "Analise" },
];

const progress = [
    { name: "Projeto Aurora", percent: 72, status: "Em andamento" },
    { name: "Projeto Boreal", percent: 54, status: "Revisando" },
    { name: "Projeto Celeste", percent: 38, status: "Planejamento" },
];

const weeklyTasksData = [
    { dia: "Seg", concluidas: 12, pendentes: 8 },
    { dia: "Ter", concluidas: 15, pendentes: 5 },
    { dia: "Qua", concluidas: 10, pendentes: 10 },
    { dia: "Qui", concluidas: 18, pendentes: 4 },
    { dia: "Sex", concluidas: 14, pendentes: 6 },
    { dia: "Sab", concluidas: 8, pendentes: 2 },
    { dia: "Dom", concluidas: 5, pendentes: 1 },
];

const monthlyProgressData = [
    { mes: "Jan", progresso: 45 },
    { mes: "Fev", progresso: 52 },
    { mes: "Mar", progresso: 61 },
    { mes: "Abr", progresso: 58 },
    { mes: "Mai", progresso: 70 },
    { mes: "Jun", progresso: 75 },
];

export default function Dashboard() {
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
                        Bom dia, Oriente!
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 420 }}>
                        Acompanhe os principais indicadores dos seus projetos e mantenha as equipes alinhadas com os objetivos do trimestre.
                    </Typography>
                </Box>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    sx={{ width: { xs: "100%", md: "auto" } }}
                >
                    <Button variant="contained" color="primary" endIcon={<ArrowForwardOutlined />}>Ver relatorios</Button>
                    <Button variant="outlined" color="primary">Criar projeto</Button>
                </Stack>
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
                {stats.map((item) => (
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

            <Box
                sx={{
                    display: "grid",
                    gap: 3,
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(0, 2fr) minmax(0, 1fr)",
                    },
                }}
            >
                <Paper sx={{ p: 3, borderRadius: 3, minHeight: 280, display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Progresso dos projetos
                    </Typography>
                    <Stack spacing={2}>
                        {progress.map((project) => (
                            <Box key={project.name}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {project.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        {project.status}
                                    </Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={project.percent} sx={{ height: 8, borderRadius: 999 }} />
                            </Box>
                        ))}
                    </Stack>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, minHeight: 280, display: "flex", flexDirection: "column" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Proximos compromissos
                    </Typography>
                    <List disablePadding sx={{ flexGrow: 1 }}>
                        {upcoming.map((event, index) => (
                            <Fragment key={event.title}>
                                <ListItem disablePadding sx={{ py: 1 }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: "secondary.main", color: "primary.dark", width: 36, height: 36, fontSize: 13 }}>
                                            {event.chip.slice(0, 2).toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {event.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                {event.subtitle}
                                            </Typography>
                                        }
                                    />
                                    <Chip label={event.chip} size="small" color="primary" variant="outlined" />
                                </ListItem>
                                {index < upcoming.length - 1 && <Divider component="li" sx={{ ml: 7 }} />}
                            </Fragment>
                        ))}
                    </List>
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
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Tarefas da semana
                    </Typography>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={weeklyTasksData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="dia" stroke="#666" style={{ fontSize: 12 }} />
                            <YAxis stroke="#666" style={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0" }}
                                labelStyle={{ fontWeight: 600 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 13 }} />
                            <Bar dataKey="concluidas" fill="#8B6B47" name="Concluídas" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="pendentes" fill="#CBA28E" name="Pendentes" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Evolução mensal
                    </Typography>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={monthlyProgressData}>
                            <defs>
                                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B6B47" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8B6B47" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="mes" stroke="#666" style={{ fontSize: 12 }} />
                            <YAxis stroke="#666" style={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0" }}
                                labelStyle={{ fontWeight: 600 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="progresso"
                                stroke="#8B6B47"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorProgress)"
                                name="Progresso (%)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Paper>
            </Box>
        </Box>
    );
}
