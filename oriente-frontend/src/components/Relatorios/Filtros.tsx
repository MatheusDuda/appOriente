import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    TextField,
    MenuItem,
    Button,
    Stack,
    Typography,
} from "@mui/material";
import { PictureAsPdfOutlined } from "@mui/icons-material";
import projectService from "../../services/projectService";
import userService from "../../services/userService";
import { authService } from "../../services/authService";
import api from "../../services/api";
import type { ProjectSummary, User, UserRole } from "../../types";
import { UserStatus } from "../../types";

const statusOptions = [
    "Todos",
    "Concluído",
    "Em andamento",
    "Pendente",
];

export default function Filtros() {
    const [projetos, setProjetos] = useState<ProjectSummary[]>([]);
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [selectedProject, setSelectedProject] = useState<string>("Todos");
    const [selectedStatus, setSelectedStatus] = useState<string>("Todos");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [exporting, setExporting] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // Buscar dados iniciais
    useEffect(() => {
        const fetchData = async () => {
            console.log("[DEBUG] Iniciando fetchData...");

            try {
                setLoadingUsers(true);

                // Verificar token
                const token = localStorage.getItem('auth_token');
                console.log("[DEBUG] Token existe?", !!token);
                if (!token) {
                    console.error("[DEBUG] Token não encontrado no localStorage!");
                    return;
                }

                // Buscar usuário atual
                console.log("[DEBUG] Buscando usuário atual...");
                const userData = await authService.getCurrentUser();
                console.log("[DEBUG] Usuário atual:", userData);
                console.log("[DEBUG] Role do usuário:", userData.role);

                const currentUserData: User = {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role as UserRole,
                    status: UserStatus.ACTIVE,
                    created_at: userData.created_at,
                    updated_at: userData.created_at,
                };
                setCurrentUser(currentUserData);

                // Buscar projetos
                console.log("[DEBUG] Buscando projetos...");
                const projectsData = await projectService.getProjects();
                console.log("[DEBUG] Projetos carregados:", projectsData.length);
                setProjetos(projectsData);

                // Buscar usuários baseado na role
                // Normalizar role removendo prefixo "UserRole." se existir
                const normalizedRole = userData.role.replace("UserRole.", "");
                console.log("[DEBUG] Role normalizada:", normalizedRole);

                if (normalizedRole === "USER") {
                    // USER vê apenas a si mesmo e já seleciona automaticamente
                    console.log("[DEBUG] USER: mostrando apenas o próprio usuário");
                    setUsuarios([currentUserData]);
                    setSelectedUser(currentUserData.id.toString());
                } else if (normalizedRole === "MANAGER" || normalizedRole === "ADMIN") {
                    // MANAGER e ADMIN veem todos os usuários
                    console.log("[DEBUG] ADMIN/MANAGER: buscando todos os usuários");
                    try {
                        const usersResponse = await userService.getUsers(0, 100);
                        console.log("[DEBUG] Response completo:", usersResponse);
                        console.log("[DEBUG] Usuários array:", usersResponse?.users);
                        console.log("[DEBUG] Número de usuários:", usersResponse?.users?.length);

                        if (usersResponse && usersResponse.users && usersResponse.users.length > 0) {
                            setUsuarios(usersResponse.users);
                            // Selecionar automaticamente o usuário atual como padrão
                            setSelectedUser(currentUserData.id.toString());
                            console.log("[DEBUG] Usuários carregados com sucesso:", usersResponse.users.length);
                        } else {
                            console.warn("[DEBUG] Nenhum usuário retornado pela API");
                            setUsuarios([currentUserData]);
                            setSelectedUser(currentUserData.id.toString());
                        }
                    } catch (userError) {
                        console.error("[DEBUG] Erro ao buscar lista de usuários:");
                        console.error("[DEBUG] Error object:", userError);
                        console.error("[DEBUG] Error message:", (userError as any)?.message);
                        console.error("[DEBUG] Error response:", (userError as any)?.response);
                        console.error("[DEBUG] Error response data:", (userError as any)?.response?.data);

                        // Em caso de erro, pelo menos mostra o usuário atual
                        setUsuarios([currentUserData]);
                        setSelectedUser(currentUserData.id.toString());
                    }
                } else {
                    console.error("[DEBUG] Role não reconhecida:", normalizedRole, "(original:", userData.role, ")");
                }
            } catch (error) {
                console.error("[DEBUG] Erro GERAL ao buscar dados:");
                console.error("[DEBUG] Error object:", error);
                console.error("[DEBUG] Error message:", (error as any)?.message);
                console.error("[DEBUG] Error response:", (error as any)?.response);
                console.error("[DEBUG] Error response data:", (error as any)?.response?.data);
                console.error("[DEBUG] Error response status:", (error as any)?.response?.status);
            } finally {
                console.log("[DEBUG] Finalizando fetchData, setLoadingUsers(false)");
                setLoadingUsers(false);
            }
        };
        fetchData();
    }, []);

    // Aplicar filtros automaticamente quando qualquer valor mudar
    useEffect(() => {
        if (!currentUser) return;

        // Aqui você pode adicionar a lógica para aplicar os filtros
        console.log("Filtros aplicados:", {
            usuario: selectedUser,
            projeto: selectedProject,
            status: selectedStatus,
            dataInicial: startDate,
            dataFinal: endDate,
        });

        // TODO: Implementar chamada à API com os filtros quando o backend estiver pronto
    }, [selectedUser, selectedProject, selectedStatus, startDate, endDate, currentUser]);

    const handleClearFilters = () => {
        setSelectedProject("Todos");
        setSelectedStatus("Todos");
        setStartDate("");
        setEndDate("");

        // Resetar usuário para o usuário atual (não mais "Todos")
        if (currentUser) {
            setSelectedUser(currentUser.id.toString());
        }
    };

    const handleExportPDF = async () => {
        // Validar se um usuário foi selecionado
        if (!selectedUser || selectedUser === "") {
            alert("Por favor, selecione um usuário para exportar o relatório.");
            return;
        }

        try {
            setExporting(true);

            // Preparar parâmetros da requisição
            const params: any = {};

            if (startDate) {
                params.start_date = new Date(startDate).toISOString();
            }

            if (endDate) {
                params.end_date = new Date(endDate).toISOString();
            }

            if (selectedProject !== "Todos") {
                params.project_id = parseInt(selectedProject);
            }

            // Fazer chamada para o endpoint de download
            const response = await api.get(`/api/reports/user/${selectedUser}/efficiency/download`, {
                responseType: 'blob',
                params
            });

            // Criar URL temporária para o blob
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Obter nome do usuário selecionado
            const userName = usuarios.find(u => u.id.toString() === selectedUser)?.name || 'usuario';

            // Criar link temporário e fazer download
            const link = document.createElement('a');
            link.href = url;
            link.download = `relatorio_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Limpar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Erro ao exportar relatório:', error);

            let errorMessage = 'Erro ao exportar relatório. Por favor, tente novamente.';

            if (error.response) {
                if (error.response.data instanceof Blob) {
                    try {
                        const errorText = await error.response.data.text();
                        const errorData = JSON.parse(errorText);
                        console.error('Erro detalhado do backend:', errorData);
                        errorMessage = `Erro no servidor: ${errorData.detail || errorText}`;
                    } catch (e) {
                        console.error('Não foi possível parsear erro do blob:', e);
                    }
                }

                switch (error.response.status) {
                    case 401:
                        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
                        break;
                    case 403:
                        errorMessage = 'Você não tem permissão para gerar este relatório.';
                        break;
                    case 404:
                        errorMessage = 'Relatório não encontrado. Verifique se o usuário possui tarefas no período selecionado.';
                        break;
                    case 500:
                        if (!(error.response.data instanceof Blob)) {
                            errorMessage = `Erro no servidor: ${error.response.data?.detail || 'Tente novamente mais tarde'}`;
                        }
                        break;
                    default:
                        errorMessage = `Erro ${error.response.status}: ${error.response.data?.detail || 'Erro desconhecido'}`;
                }
            } else if (error.request) {
                errorMessage = 'Erro de conexão. Verifique se o servidor está rodando e tente novamente.';
            }

            alert(errorMessage);
        } finally {
            setExporting(false);
        }
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Filtros de Relatórios
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(2, minmax(0, 1fr))",
                    },
                }}
            >
                <TextField
                    select
                    label="Usuário"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                    disabled={currentUser?.role === "USER" || loadingUsers}
                    helperText={loadingUsers ? "Carregando usuários..." : ""}
                >
                    {usuarios.map((usuario) => (
                        <MenuItem key={usuario.id} value={usuario.id.toString()}>
                            {usuario.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Projeto"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                >
                    <MenuItem value="Todos">Todos</MenuItem>
                    {projetos.map((projeto) => (
                        <MenuItem key={projeto.id} value={projeto.id.toString()}>
                            {projeto.name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                >
                    {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                            {status}
                        </MenuItem>
                    ))}
                </TextField>

                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: "1fr 1fr",
                    }}
                >
                    <TextField
                        label="Data Inicial"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        variant="outlined"
                        size="small"
                        fullWidth
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                    <TextField
                        label="Data Final"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        variant="outlined"
                        size="small"
                        fullWidth
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Box>
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleClearFilters}>
                    Limpar
                </Button>
                <Button
                    variant="contained"
                    startIcon={<PictureAsPdfOutlined />}
                    onClick={handleExportPDF}
                    disabled={!selectedUser || selectedUser === "" || exporting || loadingUsers}
                >
                    {exporting ? 'Exportando...' : 'Exportar PDF'}
                </Button>
            </Stack>
        </Paper>
    );
}
