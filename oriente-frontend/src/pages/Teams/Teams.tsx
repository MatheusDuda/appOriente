import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActions,
    Avatar,
    AvatarGroup,
    Chip,
    Button,
    TextField,
    InputAdornment,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
    SearchOutlined,
    GroupAddOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import TeamMenu from "../../components/Teams/TeamMenu";
import type { TeamListItem } from "../../types";
import { TeamStatus } from "../../types";
import teamService from "../../services/teamService";

// Helper functions for status mapping
const getStatusLabel = (status: TeamStatus): string => {
    return status === TeamStatus.ACTIVE ? "Ativo" : "Inativo";
};

const getStatusColor = (status: TeamStatus) => {
    return status === TeamStatus.ACTIVE ? "success" : "default";
};

export default function Teams() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<TeamListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error" | "info",
    });

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const teamsData = await teamService.getTeams();
            setTeams(teamsData);
        } catch (error: any) {
            console.error("Erro ao carregar equipes:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.detail || "Erro ao carregar equipes",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredTeams = teams.filter(
        (team) =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.leader.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewTeam = (teamId: number) => {
        navigate(`/teams/${teamId}`);
    };

    const handleTeamDeleted = () => {
        setSnackbar({
            open: true,
            message: "Equipe excluída com sucesso!",
            severity: "success",
        });
        loadTeams();
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Equipes
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Gerencie suas equipes e seus membros
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<GroupAddOutlined />}
                    onClick={() => navigate("/equipes/nova")}
                >
                    Criar Equipe
                </Button>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar por nome, descrição ou líder..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlined />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 3 }}
                />

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredTeams.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography variant="h6" sx={{ color: "text.secondary" }}>
                            {searchTerm ? "Nenhuma equipe encontrada" : "Nenhuma equipe cadastrada"}
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {filteredTeams.map((team) => (
                            <Grid key={team.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 2, position: "relative" }}>
                                    <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
                                        <TeamMenu
                                            team={team}
                                            onTeamDeleted={handleTeamDeleted}
                                        />
                                    </Box>

                                    <CardContent sx={{ flexGrow: 1, pt: 3, pr: 5 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
                                                {team.name}
                                            </Typography>
                                            <Chip
                                                label={getStatusLabel(team.status)}
                                                color={getStatusColor(team.status)}
                                                size="small"
                                            />
                                        </Box>

                                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                                            {team.description}
                                        </Typography>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                                                Líder
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {team.leader.name}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                                                Membros ({team.members.length})
                                            </Typography>
                                            <AvatarGroup max={4} sx={{ justifyContent: "flex-start" }}>
                                                {team.members.map((member) => (
                                                    <Avatar
                                                        key={member.id}
                                                        sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.875rem" }}
                                                    >
                                                        {member.name.charAt(0)}
                                                    </Avatar>
                                                ))}
                                            </AvatarGroup>
                                        </Box>

                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                            {team.projects_count} {team.projects_count === 1 ? "projeto" : "projetos"}
                                        </Typography>
                                    </CardContent>

                                    <CardActions sx={{ p: 2, pt: 0 }}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => handleViewTeam(team.id)}
                                        >
                                            Ver Detalhes
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
