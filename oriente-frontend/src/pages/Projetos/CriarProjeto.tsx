import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { ArrowBackOutlined, SaveOutlined } from "@mui/icons-material";
import projectService from "../../services/projectService";
import teamService from "../../services/teamService";
import userService from "../../services/userService";
import type { TeamListItem, User } from "../../types";

export default function CriarProjeto() {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [teamId, setTeamId] = useState<number | "">("");
    const [memberIds, setMemberIds] = useState<number[]>([]);

    // Teams and Users data
    const [teams, setTeams] = useState<TeamListItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        loadTeams();
        loadUsers();
    }, []);

    const loadTeams = async () => {
        try {
            setLoadingTeams(true);
            const data = await teamService.getTeams();
            console.log("Equipes carregadas:", data);
            setTeams(data);
        } catch (error) {
            console.error("Erro ao carregar equipes:", error);
            setSnackbar({
                open: true,
                message: "Erro ao carregar equipes",
                severity: "error",
            });
        } finally {
            setLoadingTeams(false);
        }
    };

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await userService.getUsers(0, 100);
            // Filter only active users
            const activeUsers = response.users.filter((user) => user.status === "ACTIVE");
            console.log("Usuários ativos carregados:", activeUsers);
            setUsers(activeUsers);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            setSnackbar({
                open: true,
                message: "Erro ao carregar usuários",
                severity: "error",
            });
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSalvar = async () => {
        if (!nome || !descricao || teamId === "" || typeof teamId !== "number") {
            setSnackbar({
                open: true,
                message: "Preencha todos os campos obrigatórios (nome, descrição e equipe)",
                severity: "error",
            });
            return;
        }

        // Convert member IDs to names
        const selectedMemberNames = memberIds
            .map((id) => users.find((u) => u.id === id)?.name)
            .filter((name) => name !== undefined) as string[];

        console.log("Criando projeto:", { nome, descricao, team_id: teamId, member_ids: memberIds, member_names: selectedMemberNames });

        try {
            setSaving(true);
            await projectService.createProject({
                name: nome,
                description: descricao,
                team_id: teamId,
                member_names: selectedMemberNames,
            });

            setSnackbar({
                open: true,
                message: "Projeto criado com sucesso",
                severity: "success",
            });

            // Redirect with a small delay to ensure snackbar is visible
            setTimeout(() => {
                console.log("Navegando de volta para /projetos com refresh timestamp");
                navigate("/projetos", {
                    state: { refresh: Date.now() },
                    replace: false
                });
            }, 500);
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao criar projeto",
                severity: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelar = () => {
        navigate("/projetos");
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (loadingTeams) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                    startIcon={<ArrowBackOutlined />}
                    onClick={handleCancelar}
                    variant="outlined"
                    size="small"
                >
                    Voltar
                </Button>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Criar Novo Projeto
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Preencha os dados do projeto
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            required
                            label="Nome do Projeto"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Desenvolvimento App Mobile"
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            required
                            multiline
                            rows={4}
                            label="Descrição"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva os objetivos e escopo do projeto"
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Equipe</InputLabel>
                            <Select
                                value={teamId}
                                label="Equipe"
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const numValue = typeof value === "number" ? value : Number(value);
                                    console.log("Team selected:", { raw: value, converted: numValue });
                                    setTeamId(numValue);
                                }}
                            >
                                {teams.length === 0 ? (
                                    <MenuItem disabled>Nenhuma equipe disponível</MenuItem>
                                ) : (
                                    teams.map((team) => (
                                        <MenuItem key={team.id} value={team.id}>
                                            {team.name} ({team.members?.length || 0} membro(s))
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth disabled={loadingUsers}>
                            <InputLabel>Membros do Projeto (Opcional)</InputLabel>
                            <Select
                                multiple
                                value={memberIds}
                                label="Membros do Projeto (Opcional)"
                                onChange={(e) => setMemberIds(e.target.value as number[])}
                                renderValue={(selected) => (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const user = users.find((u) => u.id === value);
                                            return user ? (
                                                <Chip key={value} label={user.name} size="small" />
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                            >
                                {loadingUsers ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={20} />
                                    </MenuItem>
                                ) : (
                                    users.map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            <Box>
                                                <Typography variant="body2">{user.name}</Typography>
                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                    {user.email}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
                    <Button onClick={handleCancelar} variant="outlined" disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSalvar}
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveOutlined />}
                        disabled={!nome || !descricao || !teamId || saving}
                    >
                        {saving ? "Criando..." : "Criar Projeto"}
                    </Button>
                </Box>
            </Paper>

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
