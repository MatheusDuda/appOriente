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
import type { TeamListItem } from "../../types";

export default function CriarProjeto() {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [teamId, setTeamId] = useState<number | "">("");
    const [memberNames, setMemberNames] = useState<string[]>([]);
    const [memberInput, setMemberInput] = useState("");

    // Teams data
    const [teams, setTeams] = useState<TeamListItem[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(true);
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

    const handleAddMember = () => {
        const trimmedName = memberInput.trim();
        if (trimmedName && !memberNames.includes(trimmedName)) {
            setMemberNames([...memberNames, trimmedName]);
            setMemberInput("");
        }
    };

    const handleRemoveMember = (name: string) => {
        setMemberNames(memberNames.filter((m) => m !== name));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddMember();
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

        console.log("Criando projeto:", { nome, descricao, team_id: teamId, member_names: memberNames });

        try {
            setSaving(true);
            await projectService.createProject({
                name: nome,
                description: descricao,
                team_id: teamId,
                member_names: memberNames,
            });

            setSnackbar({
                open: true,
                message: "Projeto criado com sucesso",
                severity: "success",
            });

            // Redirect with a small delay to ensure snackbar is visible
            setTimeout(() => {
                console.log("Navegando de volta para /projetos com refresh timestamp");
                navigate("/projects", {
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
        navigate("/projects");
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
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Membros do Projeto (Opcional)
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", mb: 2, display: "block" }}>
                            Digite os nomes dos membros e pressione Enter para adicionar
                        </Typography>
                        <TextField
                            fullWidth
                            label="Nome do Membro"
                            value={memberInput}
                            onChange={(e) => setMemberInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ex: João Silva"
                            helperText="Pressione Enter para adicionar"
                        />
                    </Grid>

                    {memberNames.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Membros Adicionados ({memberNames.length})
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {memberNames.map((name) => (
                                        <Chip
                                            key={name}
                                            label={name}
                                            onDelete={() => handleRemoveMember(name)}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                    )}
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
