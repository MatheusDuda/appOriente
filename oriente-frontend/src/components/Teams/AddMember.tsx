import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Checkbox,
    TextField,
    InputAdornment,
    Box,
    IconButton,
    Typography,
    CircularProgress,
    Alert,
} from "@mui/material";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import type { User, TeamMember } from "../../types";
import userService from "../../services/userService";
import teamService from "../../services/teamService";

type AddMemberDialogProps = {
    open: boolean;
    onClose: () => void;
    onMembersAdded: () => void;
    teamId: number;
    currentMembers: TeamMember[];
};

export default function AddMemberDialog({
    open,
    onClose,
    onMembersAdded,
    teamId,
    currentMembers
}: AddMemberDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (open) {
            loadUsers();
        }
    }, [open]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userService.getUsers(0, 100); // Reduzido para 100
            setUsers(response.users);
        } catch (error: any) {
            console.error("Erro ao carregar usuários:", error);
            console.error("Detalhes do erro:", error.response?.data);
            const errorMessage = error.response?.data?.detail || error.message || "Erro ao carregar usuários disponíveis";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleAdd = async () => {
        try {
            setAdding(true);
            setError(null);
            const response = await teamService.addMembers(teamId, selectedIds);

            console.log("Add members response:", response);

            // Show feedback about the operation
            if (response.already_members && response.already_members.length > 0 ||
                response.not_found && response.not_found.length > 0) {
                let message = "";
                if (response.added_members && response.added_members.length > 0) {
                    message += `${response.added_members.length} membro(s) adicionado(s). `;
                }
                if (response.already_members && response.already_members.length > 0) {
                    message += `${response.already_members.length} já era(m) membro(s). `;
                }
                if (response.not_found && response.not_found.length > 0) {
                    message += `${response.not_found.length} não encontrado(s).`;
                }
                alert(message);
            }

            setSelectedIds([]);
            setSearchTerm("");
            onMembersAdded();
            onClose();
        } catch (error: any) {
            console.error("Erro ao adicionar membros:", error);
            console.error("Response error:", error.response);
            const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || "Erro ao adicionar membros";
            setError(errorMsg);
        } finally {
            setAdding(false);
        }
    };

    const handleClose = () => {
        setSelectedIds([]);
        setSearchTerm("");
        setError(null);
        onClose();
    };

    // Filter users that are NOT already members
    const currentMemberIds = currentMembers.map(m => m.id);
    const availableUsers = users.filter(user => !currentMemberIds.includes(user.id));

    const filteredUsers = availableUsers.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (

        <Dialog

            open={open}

            onClose={handleClose}

            maxWidth="sm"

            fullWidth

            PaperProps={{

                sx: { borderRadius: 3 },

            }}

        >

            <DialogTitle sx={{ fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                Adicionar Membros

                <IconButton size="small" onClick={handleClose} aria-label="Fechar">

                    <CloseOutlined fontSize="small" />

                </IconButton>

            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlined />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 2 }}
                />

                {selectedIds.length > 0 && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: "primary.light", borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ color: "primary.dark", fontWeight: 600 }}>
                            {selectedIds.length} {selectedIds.length === 1 ? "membro selecionado" : "membros selecionados"}
                        </Typography>
                    </Box>
                )}

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredUsers.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {searchTerm ? "Nenhum usuário encontrado" : "Todos os usuários já são membros"}
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 400, overflow: "auto" }}>
                        {filteredUsers.map((user) => (
                            <ListItem
                                key={user.id}
                                disablePadding
                                sx={{ mb: 0.5 }}
                            >
                                <ListItemButton
                                    onClick={() => handleToggle(user.id)}
                                    sx={{
                                        borderRadius: 1,
                                        gap: 1.5,
                                        alignItems: "center",
                                        "&:hover": {
                                            bgcolor: "action.hover",
                                        },
                                    }}
                                >
                                    <Checkbox
                                        edge="start"
                                        checked={selectedIds.includes(user.id)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: "primary.main" }}>
                                            {user.name.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {user.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                {user.email}
                                            </Typography>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={handleClose} variant="outlined" disabled={adding}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleAdd}
                    variant="contained"
                    disabled={selectedIds.length === 0 || adding}
                    startIcon={adding ? <CircularProgress size={20} /> : null}
                >
                    {adding ? "Adicionando..." : `Adicionar (${selectedIds.length})`}
                </Button>
            </DialogActions>

        </Dialog>

    );

}
