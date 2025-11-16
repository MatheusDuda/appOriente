import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Checkbox,
    InputAdornment,
    Box,
    IconButton,
    Typography,
    Chip,
} from "@mui/material";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";

type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
};

type CreateGroupDialogProps = {
    open: boolean;
    onClose: () => void;
};

const availableUsers: User[] = [
    { id: 1, name: "João Silva", email: "joao.silva@oriente.com" },
    { id: 2, name: "Maria Santos", email: "maria.santos@oriente.com" },
    { id: 3, name: "Pedro Costa", email: "pedro.costa@oriente.com" },
    { id: 4, name: "Ana Oliveira", email: "ana.oliveira@oriente.com" },
    { id: 5, name: "Carlos Lima", email: "carlos.lima@oriente.com" },
    { id: 6, name: "Beatriz Rocha", email: "beatriz.rocha@oriente.com" },
    { id: 7, name: "Rafael Mendes", email: "rafael.mendes@oriente.com" },
    { id: 8, name: "Juliana Alves", email: "juliana.alves@oriente.com" },
];

export default function CreateGroupDialog({ open, onClose }: CreateGroupDialogProps) {
    const [step, setStep] = useState<"selecionar" | "nomear">("selecionar");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [groupName, setGroupName] = useState("");

    const handleToggle = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleNext = () => {
        setStep("nomear");
    };

    const handleBack = () => {
        setStep("selecionar");
    };

    const handleCreate = () => {
        console.log("Criar grupo:", { nome: groupName, membros: selectedIds });
        handleClose();
    };

    const handleClose = () => {
        setStep("selecionar");
        setSelectedIds([]);
        setGroupName("");
        setSearchTerm("");
        onClose();
    };

    const filteredUsers = availableUsers.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedMembers = availableUsers.filter((u) => selectedIds.includes(u.id));

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
                {step === "selecionar" ? "Selecionar Participantes" : "Criar Grupo"}
                <IconButton size="small" onClick={handleClose} aria-label="Fechar">
                    <CloseOutlined fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {step === "selecionar" ? (
                    <>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar pessoas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlined fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        {selectedIds.length > 0 && (
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: "primary.light", borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ color: "primary.dark", fontWeight: 600, mb: 1 }}>
                                    {selectedIds.length} {selectedIds.length === 1 ? "pessoa selecionada" : "pessoas selecionadas"}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {selectedMembers.map((member) => (
                                        <Chip
                                            key={member.id}
                                            label={member.name}
                                            size="small"
                                            onDelete={() => handleToggle(member.id)}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

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

                    </>

                ) : (

                    <>

                        <TextField
                            fullWidth
                            label="Nome do Grupo"
                            placeholder="Ex: Equipe de Projeto"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            autoFocus
                            sx={{ mb: 3 }}
                        />

                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                            Participantes ({selectedIds.length})
                        </Typography>

                        <List sx={{ maxHeight: 300, overflow: "auto" }}>
                            {selectedMembers.map((user) => (
                                <ListItem key={user.id} sx={{ px: 0 }}>
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
                                        secondary={user.email}
                                    />
                                </ListItem>
                            ))}
                        </List>

                    </>

                )}

            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                {step === "selecionar" ? (
                    <>
                        <Button onClick={handleClose} variant="outlined">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleNext}
                            variant="contained"
                            disabled={selectedIds.length < 2}
                        >
                            Próximo ({selectedIds.length})
                        </Button>
                    </>

                ) : (

                    <>
                        <Button onClick={handleBack} variant="outlined">
                            Voltar
                        </Button>
                        <Button
                            onClick={handleCreate}
                            variant="contained"
                            disabled={!groupName.trim()}
                        >
                            Criar Grupo
                        </Button>
                    </>

                )}

            </DialogActions>

        </Dialog>

    );

}
