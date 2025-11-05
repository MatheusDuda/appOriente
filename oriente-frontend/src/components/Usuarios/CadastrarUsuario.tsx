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

type CadastrarUsuarioProps = {
    open: boolean;
    onClose: () => void;
};

const roles = ["Admin", "Gerente", "Membro", "Visualizador"];

export default function CadastrarUsuario({ open, onClose }: CadastrarUsuarioProps) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        console.log("Cadastrar usuário:", data);
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
                Cadastrar Novo Usuário
                <IconButton size="small" onClick={onClose} aria-label="Fechar">
                    <CloseOutlined fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Box component="form" onSubmit={handleSubmit}>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField
                        name="nome"
                        label="Nome Completo"
                        fullWidth
                        required
                        autoFocus
                    />

                    <TextField
                        name="email"
                        label="Email"
                        type="email"
                        fullWidth
                        required
                    />

                    <TextField
                        name="cargo"
                        label="Cargo"
                        fullWidth
                        required
                    />

                    <TextField
                        name="role"
                        label="Função"
                        select
                        defaultValue="Membro"
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
                        name="senha"
                        label="Senha Temporária"
                        type="password"
                        fullWidth
                        required
                        helperText="O usuário deverá alterar esta senha no primeiro login"
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={onClose} variant="outlined">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained">
                        Cadastrar Usuário
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}
