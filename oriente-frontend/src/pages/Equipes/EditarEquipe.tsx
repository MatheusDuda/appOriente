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
} from "@mui/material";
import {
    ArrowBackOutlined,
    SaveOutlined,
    PersonAddOutlined,
    DeleteOutlineOutlined,
} from "@mui/icons-material";
import AdicionarMembroDialog from "../../components/Equipes/AdicionarMembro";
import ConfirmDialog from "../../components/Common/ConfirmDialog";

type Membro = {
    id: number;
    nome: string;
    email: string;
    cargo: string;
    avatar?: string;
};

const mockMembros: Membro[] = [
    { id: 1, nome: "João Silva", email: "joao.silva@oriente.com", cargo: "Tech Lead" },
    { id: 2, nome: "Maria Santos", email: "maria.santos@oriente.com", cargo: "Product Manager" },
    { id: 3, nome: "Pedro Costa", email: "pedro.costa@oriente.com", cargo: "Desenvolvedor Senior" },
    { id: 4, nome: "Ana Oliveira", email: "ana.oliveira@oriente.com", cargo: "QA Engineer" },
];

const statusOptions = ["Ativo", "Inativo"];

export default function EditarEquipe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [adicionarMembroOpen, setAdicionarMembroOpen] = useState(false);
    const [membros, setMembros] = useState<Membro[]>(mockMembros);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        membroId: number | null;
    }>({
        open: false,
        membroId: null,
    });

    useEffect(() => {
        if (searchParams.get("action") === "add-member") {
            setAdicionarMembroOpen(true);
        }
    }, [searchParams]);

    const handleRemoverMembro = (membroId: number) => {
        setConfirmDialog({ open: true, membroId });
    };

    const confirmarRemocao = () => {
        if (confirmDialog.membroId) {
            setMembros(membros.filter((m) => m.id !== confirmDialog.membroId));
        }
        setConfirmDialog({ open: false, membroId: null });
    };

    const handleSalvar = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        console.log("Salvar equipe:", { ...data, membros });
        navigate("/equipes");
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
                <Button
                    variant="text"
                    startIcon={<ArrowBackOutlined />}
                    onClick={() => navigate("/equipes")}
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

            <Box component="form" onSubmit={handleSalvar}>
                <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
                        Informações da Equipe
                    </Typography>

                    <Stack spacing={2.5}>
                        <TextField
                            name="nome"
                            label="Nome da Equipe"
                            defaultValue={id === "nova" ? "" : "Equipe Atlas"}
                            fullWidth
                            required
                        />

                        <TextField
                            name="descricao"
                            label="Descrição"
                            defaultValue={id === "nova" ? "" : "Desenvolvimento de produtos core"}
                            fullWidth
                            multiline
                            rows={3}
                            required
                        />

                        <TextField
                            name="lider"
                            label="Líder da Equipe"
                            defaultValue={id === "nova" ? "" : "João Silva"}
                            fullWidth
                            required
                        />

                        <TextField
                            name="status"
                            label="Status"
                            select
                            defaultValue="Ativo"
                            fullWidth
                            required
                        >
                            {statusOptions.map((status) => (
                                <MenuItem key={status} value={status}>
                                    {status}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Membros da Equipe ({membros.length})
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PersonAddOutlined />}
                            onClick={() => setAdicionarMembroOpen(true)}
                        >
                            Adicionar Membro
                        </Button>
                    </Box>

                    <List disablePadding>
                        {membros.map((membro, index) => (
                            <ListItem
                                key={membro.id}
                                sx={{
                                    px: 0,
                                    borderBottom: index < membros.length - 1 ? "1px solid" : "none",
                                    borderColor: "divider",
                                }}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        aria-label="Remover membro"
                                        onClick={() => handleRemoverMembro(membro.id)}
                                    >
                                        <DeleteOutlineOutlined />
                                    </IconButton>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: "primary.main" }}>
                                        {membro.nome.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {membro.nome}
                                            </Typography>
                                            {membro.nome === "João Silva" && (
                                                <Chip label="Líder" size="small" color="primary" />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                            {membro.email} • {membro.cargo}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => navigate("/equipes")}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" startIcon={<SaveOutlined />}>
                        {id === "nova" ? "Criar Equipe" : "Salvar Alterações"}
                    </Button>
                </Stack>
            </Box>

            <AdicionarMembroDialog
                open={adicionarMembroOpen}
                onClose={() => setAdicionarMembroOpen(false)}
                onAdd={(novosMembros) => {
                    setMembros([...membros, ...novosMembros]);
                    setAdicionarMembroOpen(false);
                }}
            />

            <ConfirmDialog
                open={confirmDialog.open}
                title="Remover Membro"
                message="Tem certeza que deseja remover este membro da equipe?"
                onConfirm={confirmarRemocao}
                onCancel={() => setConfirmDialog({ open: false, membroId: null })}
                confirmColor="error"
                confirmText="Remover"
            />
        </Box>
    );
}
