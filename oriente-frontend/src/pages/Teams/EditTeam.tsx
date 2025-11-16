import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Chip,
    MenuItem,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    ArrowBackOutlined,
    SaveOutlined,
    PersonAddOutlined,
    DeleteOutlineOutlined,
} from "@mui/icons-material";
import AddMemberDialog from "../../components/Teams/AddMember";
import ConfirmDialog from "../../components/Common/ConfirmDialog";
import type { TeamDetailed } from "../../types";
import { TeamStatus } from "../../types";
import teamService from "../../services/teamService";
import { authService } from "../../services/authService";

const statusOptions: { value: TeamStatus; label: string }[] = [
    { value: TeamStatus.ACTIVE, label: "Ativo" },
    { value: TeamStatus.INACTIVE, label: "Inativo" },
];

export default function EditTeam() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Team data
    const [team, setTeam] = useState<TeamDetailed | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TeamStatus>(TeamStatus.ACTIVE);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Dialogs
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        memberId: number | null;
    }>({
        open: false,
        memberId: null,
    });

    useEffect(() => {
        loadCurrentUser();
        if (id !== "nova") {
            loadTeam();
        }
    }, [id]);

    useEffect(() => {
        if (searchParams.get("action") === "add-member") {
            setAddMemberOpen(true);
        }
    }, [searchParams]);

    const loadCurrentUser = async () => {
        try {
            const user = await authService.getCurrentUser();
            setCurrentUserId(user.id);
        } catch (error: any) {
            console.error("Erro ao carregar usuário atual:", error);
            setError("Erro ao carregar dados do usuário");
        }
    };

    const loadTeam = async () => {
        try {
            setLoading(true);
            setError(null);
            const teamData = await teamService.getTeamById(Number(id));
            setTeam(teamData);
            setName(teamData.name);
            setDescription(teamData.description);
            setStatus(teamData.status);
        } catch (error: any) {
            console.error("Erro ao carregar equipe:", error);
            setError(error.response?.data?.detail || "Erro ao carregar equipe");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = (memberId: number) => {
        setConfirmDialog({ open: true, memberId });
    };

    const confirmRemoval = async () => {
        if (!confirmDialog.memberId || !team) return;

        try {
            await teamService.removeMember(team.id, confirmDialog.memberId);
            setConfirmDialog({ open: false, memberId: null });
            loadTeam(); // Reload team data
        } catch (error: any) {
            console.error("Erro ao remover membro:", error);
            alert(error.response?.data?.detail || "Erro ao remover membro");
            setConfirmDialog({ open: false, memberId: null });
        }
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!currentUserId) {
            setError("Erro ao identificar usuário atual");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            if (id === "nova") {
                // Create new team (current user is automatically the leader)
                await teamService.createTeam({
                    name,
                    description,
                    leader_id: currentUserId,
                    status,
                    member_ids: [currentUserId], // Start with current user as only member
                });
            } else {
                // Update existing team
                await teamService.updateTeam(Number(id), {
                    name,
                    description,
                    status,
                });
            }

            navigate("/teams");
        } catch (error: any) {
            console.error("Erro ao salvar equipe:", error);
            setError(error.response?.data?.detail || "Erro ao salvar equipe");
        } finally {
            setSaving(false);
        }
    };

    const handleMembersAdded = () => {
        setAddMemberOpen(false);
        if (team) {
            loadTeam(); // Reload to get updated members
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
                <Button
                    variant="text"
                    startIcon={<ArrowBackOutlined />}
                    onClick={() => navigate("/teams")}
                    sx={{ mb: 2 }}
                >
                    Voltar
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {id === "nova" ? "Criar Nova Equipe" : "Editar Equipe"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {id === "nova" ? "Preencha as informações para criar uma nova equipe" : "Gerencie os detalhes e membros da equipe"}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSave}>
                <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
                        Informações da Equipe
                    </Typography>

                    <Stack spacing={2.5}>
                        <TextField
                            label="Nome da Equipe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            required
                            disabled={saving}
                        />

                        <TextField
                            label="Descrição"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                            required
                            disabled={saving}
                        />

                        {id === "nova" && (
                            <Alert severity="info">
                                Você será automaticamente definido como líder da equipe.
                            </Alert>
                        )}

                        <TextField
                            label="Status"
                            select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as TeamStatus)}
                            fullWidth
                            required
                            disabled={saving}
                        >
                            {statusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </Paper>

                {id !== "nova" && team && (
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Membros da Equipe ({team.members.length})
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PersonAddOutlined />}
                                onClick={() => setAddMemberOpen(true)}
                                disabled={saving}
                            >
                                Adicionar Membro
                            </Button>
                        </Box>

                        {team.members.length === 0 ? (
                            <Box sx={{ textAlign: "center", py: 4 }}>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Nenhum membro na equipe
                                </Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {team.members.map((member, index) => (
                                    <ListItem
                                        key={member.id}
                                        sx={{
                                            px: 0,
                                            borderBottom: index < team.members.length - 1 ? "1px solid" : "none",
                                            borderColor: "divider",
                                        }}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                aria-label="Remover membro"
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={saving}
                                            >
                                                <DeleteOutlineOutlined />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                                {member.name.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {member.name}
                                                    </Typography>
                                                    {team.leader_id === member.id && (
                                                        <Chip label="Líder" size="small" color="primary" />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                    {member.email}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => navigate("/equipes")} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveOutlined />}
                        disabled={saving}
                    >
                        {saving ? "Salvando..." : id === "nova" ? "Criar Equipe" : "Salvar Alterações"}
                    </Button>
                </Stack>
            </Box>

            {id !== "nova" && team && (
                <AddMemberDialog
                    open={addMemberOpen}
                    onClose={() => setAddMemberOpen(false)}
                    onMembersAdded={handleMembersAdded}
                    teamId={team.id}
                    currentMembers={team.members}
                />
            )}

            <ConfirmDialog
                open={confirmDialog.open}
                title="Remover Membro"
                message="Tem certeza que deseja remover este membro da equipe?"
                onConfirm={confirmRemoval}
                onCancel={() => setConfirmDialog({ open: false, memberId: null })}
                confirmColor="error"
                confirmText="Remover"
            />
        </Box>
    );
}
