import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    IconButton,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
} from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";
import userService from "../../services/userService";
import type { User, UserRole } from "../../types";

type EditarPermissaoDialogProps = {
    open: boolean;
    onClose: () => void;
    user: User | null;
    onPermissionUpdated: () => void;
};

const roleLabels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    USER: "Usuário",
    MANAGER: "Gerenciador",
};

export default function EditarPermissaoDialog({
    open,
    onClose,
    user,
    onPermissionUpdated,
}: EditarPermissaoDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole | "">(user?.role || "");

    const handleRoleChange = (event: any) => {
        setSelectedRole(event.target.value);
    };

    const handleSubmit = async () => {
        if (!user || !selectedRole) return;

        setError(null);

        try {
            setLoading(true);
            await userService.updateUserRole(user.id, selectedRole as UserRole);
            onPermissionUpdated();
            onClose();
        } catch (error: any) {
            console.error("Erro ao atualizar permissão:", error);
            setError(
                error.response?.data?.detail ||
                    "Erro ao atualizar permissão. Tente novamente."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 },
            }}
        >
            <DialogTitle
                sx={{
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                Editar Permissão
                <IconButton
                    size="small"
                    onClick={onClose}
                    aria-label="Fechar"
                    disabled={loading}
                >
                    <CloseOutlined fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box>
                        <p style={{ margin: "0 0 8px 0", fontSize: "0.875rem", color: "#666" }}>
                            Usuário
                        </p>
                        <Chip
                            label={`${user.name} (${user.email})`}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>

                    <Box>
                        <p style={{ margin: "0 0 8px 0", fontSize: "0.875rem", color: "#666" }}>
                            Permissão Atual
                        </p>
                        <Chip
                            label={roleLabels[user.role]}
                            color="default"
                            variant="outlined"
                        />
                    </Box>

                    <FormControl fullWidth disabled={loading}>
                        <InputLabel id="role-select-label">Nova Permissão</InputLabel>
                        <Select
                            labelId="role-select-label"
                            id="role-select"
                            value={selectedRole}
                            label="Nova Permissão"
                            onChange={handleRoleChange}
                        >
                            <MenuItem value="ADMIN">
                                {roleLabels.ADMIN}
                            </MenuItem>
                            <MenuItem value="MANAGER">
                                {roleLabels.MANAGER}
                            </MenuItem>
                            <MenuItem value="USER">
                                {roleLabels.USER}
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} variant="outlined" disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || selectedRole === user.role || !selectedRole}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
