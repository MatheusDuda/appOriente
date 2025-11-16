import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    IconButton,
    CircularProgress,
    Alert,
} from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";
import userService from "../../services/userService";
import type { User } from "../../types";

type EditUserProps = {
    open: boolean;
    onClose: () => void;
    user: User;
    onUserUpdated: () => void;
};

export default function EditUser({ open, onClose, user, onUserUpdated }: EditUserProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
        };

        try {
            setLoading(true);
            await userService.updateUser(user.id, data);
            onUserUpdated();
            onClose();
        } catch (error: any) {
            console.error("Erro ao atualizar usuário:", error);
            setError(error.response?.data?.detail || "Erro ao atualizar usuário. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

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
            <DialogTitle sx={{ fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Editar Usuário
                <IconButton size="small" onClick={onClose} aria-label="Fechar" disabled={loading}>
                    <CloseOutlined fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Box component="form" onSubmit={handleSubmit}>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        name="name"
                        label="Nome Completo"
                        defaultValue={user.name}
                        fullWidth
                        required
                        disabled={loading}
                    />

                    <TextField
                        name="email"
                        label="Email"
                        type="email"
                        defaultValue={user.email}
                        fullWidth
                        required
                        disabled={loading}
                    />

                    <Alert severity="info">
                        Nota: Para alterar a função ou status do usuário, use as opções no menu de ações.
                    </Alert>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={onClose} variant="outlined" disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}
