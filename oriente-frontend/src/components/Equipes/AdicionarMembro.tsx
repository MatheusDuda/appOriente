import { useState } from "react";
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
} from "@mui/material";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";

type Membro = {

    id: number;

    nome: string;

    email: string;

    cargo: string;

    avatar?: string;

};

type AdicionarMembroDialogProps = {

    open: boolean;

    onClose: () => void;

    onAdd: (membros: Membro[]) => void;

};

const usuariosDisponiveis: Membro[] = [

    { id: 5, nome: "Carlos Lima", email: "carlos.lima@oriente.com", cargo: "Designer UX" },

    { id: 6, nome: "Beatriz Rocha", email: "beatriz.rocha@oriente.com", cargo: "Scrum Master" },

    { id: 7, nome: "Rafael Mendes", email: "rafael.mendes@oriente.com", cargo: "Desenvolvedor Junior" },

    { id: 8, nome: "Juliana Alves", email: "juliana.alves@oriente.com", cargo: "Analista de Dados" },

    { id: 9, nome: "Lucas Ferreira", email: "lucas.ferreira@oriente.com", cargo: "DevOps Engineer" },

    { id: 10, nome: "Roberto Dias", email: "roberto.dias@oriente.com", cargo: "QA Analyst" },

    { id: 11, nome: "Fernanda Souza", email: "fernanda.souza@oriente.com", cargo: "Backend Developer" },

    { id: 12, nome: "Mariana Costa", email: "mariana.costa@oriente.com", cargo: "Marketing Specialist" },

];

export default function AdicionarMembroDialog({ open, onClose, onAdd }: AdicionarMembroDialogProps) {

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const handleToggle = (id: number) => {

        setSelectedIds((prev) =>

            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]

        );

    };

    const handleAdicionar = () => {

        const membrosSelecionados = usuariosDisponiveis.filter((u) => selectedIds.includes(u.id));

        onAdd(membrosSelecionados);

        setSelectedIds([]);

        setSearchTerm("");

    };

    const handleClose = () => {

        setSelectedIds([]);

        setSearchTerm("");

        onClose();

    };

    const filteredUsuarios = usuariosDisponiveis.filter(

        (usuario) =>

            usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||

            usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||

            usuario.cargo.toLowerCase().includes(searchTerm.toLowerCase())

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

                <TextField

                    fullWidth

                    placeholder="Buscar por nome, email ou cargo..."

                    value={searchTerm}

                    onChange={(e) => setSearchTerm(e.target.value)}

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

                <List sx={{ maxHeight: 400, overflow: "auto" }}>
                    {filteredUsuarios.map((usuario) => (
                        <ListItem
                            key={usuario.id}
                            disablePadding
                            sx={{ mb: 0.5 }}
                        >
                            <ListItemButton
                                onClick={() => handleToggle(usuario.id)}
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
                                    checked={selectedIds.includes(usuario.id)}
                                    tabIndex={-1}
                                    disableRipple
                                />
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: "primary.main" }}>
                                        {usuario.nome.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {usuario.nome}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                            {usuario.email} ? {usuario.cargo}
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>

                <Button onClick={handleClose} variant="outlined">

                    Cancelar

                </Button>

                <Button

                    onClick={handleAdicionar}

                    variant="contained"

                    disabled={selectedIds.length === 0}

                >

                    Adicionar ({selectedIds.length})

                </Button>

            </DialogActions>

        </Dialog>

    );

}
