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
} from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";

type Usuario = {
    id: number;
    nome: string;
    email: string;
    cargo: string;
    role: "Admin" | "Gerente" | "Membro" | "Visualizador";
    status: "Ativo" | "Inativo";
};

type EditarUsuarioProps = {
    open: boolean;
    onClose: () => void;
    usuario: Usuario;
};

const roles = ["Admin", "Gerente", "Membro", "Visualizador"];
const statusOptions = ["Ativo", "Inativo"];

export default function EditarUsuario({ open, onClose, usuario }: EditarUsuarioProps) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        console.log("Editar usuário:", data);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 },
            }}
        >
            <DialogTitle sx={{ fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Editar Usuário
                <IconButton size="small" onClick={onClose} aria-label="Fechar">
                    <CloseOutlined fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Box component="form" onSubmit={handleSubmit}>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField
                        name="nome"
                        label="Nome Completo"
                        defaultValue={usuario.nome}
                        fullWidth
                        required
                    />

                    <TextField
                        name="email"
                        label="Email"
                        type="email"
                        defaultValue={usuario.email}
                        fullWidth
                        required
                    />

                    <TextField
                        name="cargo"
                        label="Cargo"
                        defaultValue={usuario.cargo}
                        fullWidth
                        required
                    />

                    <TextField
                        name="role"
                        label="Função"
                        select
                        defaultValue={usuario.role}
                        fullWidth
                        required
                    >
                        {roles.map((role) => (
                            <MenuItem key={role} value={role}>
                                {role}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        name="status"
                        label="Status"
                        select
                        defaultValue={usuario.status}
                        fullWidth
                        required
                    >
                        {statusOptions.map((status) => (
                            <MenuItem key={status} value={status}>
                                {status}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={onClose} variant="outlined">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained">
                        Salvar Alterações
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}
