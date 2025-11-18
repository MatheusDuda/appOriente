import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
    Autocomplete,
    Alert,
    Chip,
} from "@mui/material";
import type { Project, User } from "../../types";
import userService from "../../services/userService";

type EditProjectDialogProps = {
    open: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        description: string;
        member_names: string[];
    }) => void;
    project: Project | null;
    isSaving?: boolean;
};

export default function EditProjectDialog({
    open,
    onClose,
    onSave,
    project,
    isSaving = false,
}: EditProjectDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega usuários quando o dialog abre
    useEffect(() => {
        if (open && project) {
            loadUsers();
            // Reseta os valores com os dados do projeto
            setName(project.name);
            setDescription(project.description);
            setSelectedMembers(project.member_names || []);
            setError(null);
        }
    }, [open, project]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await userService.getUsers(0, 100);
            const activeUsers = response.users.filter(
                (user) => user.status === "ACTIVE"
            );
            setAvailableUsers(activeUsers);
        } catch (err) {
            console.error("Erro ao carregar usuários:", err);
            setError("Não foi possível carregar a lista de usuários");
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSave = () => {
        if (!name.trim()) {
            setError("O nome do projeto é obrigatório");
            return;
        }

        setError(null);
        onSave({
            name: name.trim(),
            description: description.trim(),
            member_names: selectedMembers,
        });
    };

    const handleClose = () => {
        setName("");
        setDescription("");
        setSelectedMembers([]);
        setError(null);
        onClose();
    };

    const memberOptions = availableUsers.map((user) => ({
        label: `${user.name} (${user.email})`,
        value: user.name,
    }));

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Editar Projeto</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        fullWidth
                        label="Nome do Projeto"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: App Mobile, Backend API, etc."
                        disabled={isSaving}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !isSaving) {
                                handleSave();
                            }
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Descrição"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descrição do projeto..."
                        multiline
                        rows={3}
                        disabled={isSaving}
                    />

                    {loadingUsers ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <Autocomplete
                            multiple
                            options={memberOptions}
                            getOptionLabel={(option) =>
                                typeof option === "string" ? option : option.label
                            }
                            value={selectedMembers.map((name) => ({
                                label: availableUsers.find((u) => u.name === name)
                                    ? `${name} (${availableUsers.find((u) => u.name === name)?.email})`
                                    : name,
                                value: name,
                            }))}
                            onChange={(_, newValue) => {
                                setSelectedMembers(
                                    newValue.map((item) =>
                                        typeof item === "string" ? item : item.value
                                    )
                                );
                            }}
                            disabled={isSaving}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Membros do Projeto"
                                    placeholder="Selecione membros..."
                                />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        label={
                                            typeof option === "string"
                                                ? option
                                                : option.value
                                        }
                                        {...getTagProps({ index })}
                                        disabled={isSaving}
                                    />
                                ))
                            }
                        />
                    )}

                    <Box sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                        {selectedMembers.length} membro(s) selecionado(s)
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isSaving}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!name.trim() || isSaving}
                >
                    {isSaving ? (
                        <>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            Salvando...
                        </>
                    ) : (
                        "Salvar"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
