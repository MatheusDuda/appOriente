import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Button,
    TextField,
    Grid,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    EditOutlined,
    EmailOutlined,
    CalendarTodayOutlined,
    BadgeOutlined,
    SaveOutlined,
    CancelOutlined,
    AdminPanelSettingsOutlined,
    PersonOutlined,
    SupervisorAccountOutlined,
} from "@mui/icons-material";
import { authService } from "../../services/authService";
import userService from "../../services/userService";
import teamService from "../../services/teamService";
import type { User, TeamListItem, UserRole } from "../../types";

const getRoleIcon = (role: UserRole) => {
    switch (role) {
        case "ADMIN":
            return <AdminPanelSettingsOutlined fontSize="small" />;
        case "MANAGER":
            return <SupervisorAccountOutlined fontSize="small" />;
        default:
            return <PersonOutlined fontSize="small" />;
    }
};

const getRoleLabel = (role: UserRole) => {
    switch (role) {
        case "ADMIN":
            return "Administrador";
        case "MANAGER":
            return "Gerente";
        default:
            return "Usuário";
    }
};

export default function Perfil() {
    const [usuario, setUsuario] = useState<User | null>(null);
    const [teams, setTeams] = useState<TeamListItem[]>([]);
    const [editando, setEditando] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Primeiro, buscar dados básicos do usuário atual para obter o ID
            const currentUser = await authService.getCurrentUser();

            // Depois, buscar dados completos do usuário por ID
            const userData = await userService.getUserById(currentUser.id);
            setUsuario(userData);
            setFormData({
                name: userData.name,
                email: userData.email,
            });

            // Buscar equipes do usuário
            try {
                const userTeams = await teamService.getMyTeams();
                setTeams(userTeams);
            } catch (teamError) {
                console.error("Erro ao carregar equipes:", teamError);
                // Não bloqueamos a interface se falhar ao carregar equipes
                setTeams([]);
            }
        } catch (err) {
            console.error("Erro ao carregar dados do usuário:", err);
            setError("Não foi possível carregar os dados do perfil.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditar = () => {
        if (usuario) {
            setFormData({
                name: usuario.name,
                email: usuario.email,
            });
            setEditando(true);
        }
    };

    const handleCancelar = () => {
        if (usuario) {
            setFormData({
                name: usuario.name,
                email: usuario.email,
            });
        }
        setEditando(false);
    };

    const handleSalvar = async () => {
        if (!usuario) return;

        try {
            setError(null);
            const updatedUser = await userService.updateUser(usuario.id, formData);
            setUsuario(updatedUser);
            setEditando(false);
        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            setError("Não foi possível atualizar o perfil. Verifique os dados e tente novamente.");
        }
    };

    const handleChange = (campo: keyof typeof formData, valor: string) => {
        setFormData({ ...formData, [campo]: valor });
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !usuario) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!usuario) {
        return null;
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    Meu Perfil
                </Typography>
                {!editando ? (
                    <Button
                        startIcon={<EditOutlined />}
                        variant="contained"
                        onClick={handleEditar}
                    >
                        Editar Perfil
                    </Button>
                ) : (
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            startIcon={<CancelOutlined />}
                            variant="outlined"
                            onClick={handleCancelar}
                        >
                            Cancelar
                        </Button>
                        <Button
                            startIcon={<SaveOutlined />}
                            variant="contained"
                            onClick={handleSalvar}
                        >
                            Salvar
                        </Button>
                    </Box>
                )}
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Card de Perfil */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
                        <Box sx={{ position: "relative", display: "inline-block", mb: 2 }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    fontSize: 48,
                                    bgcolor: "primary.main",
                                }}
                            >
                                {usuario.name.charAt(0).toUpperCase()}
                            </Avatar>
                        </Box>

                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {usuario.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                            {usuario.email}
                        </Typography>
                        <Chip
                            icon={getRoleIcon(usuario.role)}
                            label={getRoleLabel(usuario.role)}
                            color="primary"
                            size="small"
                            sx={{ mb: 3 }}
                        />

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ textAlign: "left" }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 1, display: "block" }}>
                                EQUIPES
                            </Typography>
                            {teams.length > 0 ? (
                                <List dense>
                                    {teams.map((team) => (
                                        <ListItem key={team.id} sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={team.name}
                                                secondary={`${team.members.length} ${team.members.length === 1 ? 'membro' : 'membros'}`}
                                                primaryTypographyProps={{
                                                    variant: "body2",
                                                    fontWeight: 500,
                                                }}
                                                secondaryTypographyProps={{
                                                    variant: "caption",
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic", py: 1 }}>
                                    Você ainda não faz parte de nenhuma equipe
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Informações Detalhadas */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Informações Pessoais
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <BadgeOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        NOME COMPLETO
                                    </Typography>
                                </Box>
                                {editando ? (
                                    <TextField
                                        fullWidth
                                        value={formData.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        size="small"
                                        required
                                    />
                                ) : (
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.name}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <EmailOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        E-MAIL
                                    </Typography>
                                </Box>
                                {editando ? (
                                    <TextField
                                        fullWidth
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        size="small"
                                        required
                                    />
                                ) : (
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.email}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    {getRoleIcon(usuario.role)}
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        PERFIL
                                    </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {getRoleLabel(usuario.role)}
                                </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <CalendarTodayOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        MEMBRO DESDE
                                    </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {new Date(usuario.created_at).toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
