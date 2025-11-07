import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    IconButton,
    CircularProgress,
    Alert,
} from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";
import { authService } from "../../services/authService";
import { UserRole } from "../../types";

type CadastrarUsuarioProps = {
    open: boolean;
    onClose: () => void;
    onUserCreated: () => void;
};

const roles: { value: UserRole; label: string }[] = [
    { value: "USER", label: "Usuário" },
    { value: "ADMIN", label: "Administrador" },
];

export default function CadastrarUsuario({ open, onClose, onUserCreated }: CadastrarUsuarioProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            role: formData.get("role") as UserRole,
        };

        try {
            setLoading(true);
            await authService.register(data);
            onUserCreated();
            event.currentTarget.reset();
        } catch (error: any) {
            console.error("Erro ao cadastrar usuário:", error);
            setError(error.response?.data?.detail || "Erro ao cadastrar usuário. Tente novamente.");
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
                Cadastrar Novo Usuário
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
                        fullWidth
                        required
                        autoFocus
                        disabled={loading}
                    />

                    <TextField
                        name="email"
                        label="Email"
                        type="email"
                        fullWidth
                        required
                        disabled={loading}
                    />

                    <TextField
                        name="role"
                        label="Função"
                        select
                        defaultValue="USER"
                        fullWidth
                        required
                        disabled={loading}
                    >
                        {roles.map((role) => (
                            <MenuItem key={role.value} value={role.value}>
                                {role.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        name="password"
                        label="Senha Temporária"
                        type="password"
                        fullWidth
                        required
                        disabled={loading}
                        helperText="O usuário deverá alterar esta senha no primeiro login"
                    />
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
                        {loading ? "Cadastrando..." : "Cadastrar Usuário"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}
