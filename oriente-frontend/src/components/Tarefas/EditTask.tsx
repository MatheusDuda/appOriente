import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    CircularProgress,
    Typography,
    Autocomplete,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import type { Card, User, Tag } from "../../types";
import { CardPriority } from "../../types";
import userService from "../../services/userService";
import cardService from "../../services/cardService";

type EditTaskProps = {
    open: boolean;
    onClose: () => void;
    onSave: (data: {
        title: string;
        description: string;
        priority: CardPriority;
        assignee_ids: number[];
        tag_ids: number[];
        due_date?: string;
    }) => void;
    card: Card;
    projectId: number;
};

const priorities = [
    { value: CardPriority.URGENT, label: "Urgente" },
    { value: CardPriority.HIGH, label: "Alta" },
    { value: CardPriority.MEDIUM, label: "Média" },
    { value: CardPriority.LOW, label: "Baixa" },
];

export default function EditTask({
    open,
    onClose,
    onSave,
    card,
    projectId,
}: EditTaskProps) {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description);
    const [priority, setPriority] = useState<CardPriority>(card.priority);
    const [assignees, setAssignees] = useState<number[]>(
        card.assignees.map((a) => a.id)
    );
    const [selectedTags, setSelectedTags] = useState<number[]>(
        card.tags.map((t) => t.id)
    );
    const [dueDate, setDueDate] = useState(
        card.due_date ? card.due_date.split("T")[0] : ""
    );

    // Users for assignees
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Tags
    const [tags, setTags] = useState<Tag[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);

    useEffect(() => {
        if (open) {
            loadUsers();
            loadTags();
            // Reset to card values when opening
            setTitle(card.title);
            setDescription(card.description);
            setPriority(card.priority);
            setAssignees(card.assignees.map((a) => a.id));
            setSelectedTags(card.tags.map((t) => t.id));
            setDueDate(card.due_date ? card.due_date.split("T")[0] : "");
        }
    }, [open, card]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await userService.getUsers(0, 100);
            const activeUsers = response.users.filter(
                (user) => user.status === "ACTIVE"
            );
            setUsers(activeUsers);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadTags = async () => {
        try {
            setLoadingTags(true);
            const projectTags = await cardService.getProjectTags(projectId);
            setTags(projectTags);
        } catch (error) {
            console.error("Failed to load tags:", error);
        } finally {
            setLoadingTags(false);
        }
    };

    const handleSave = () => {
        if (title.trim()) {
            const data: any = {
                title: title.trim(),
                description: description.trim(),
                priority,
                assignee_ids: assignees,
                tag_ids: selectedTags,
            };

            // Only include due_date if it has a value
            if (dueDate && dueDate.trim()) {
                data.due_date = dueDate;
            }

            onSave(data);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                autoFocus
                                fullWidth
                                required
                                label="Título"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Implementar funcionalidade X"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Descrição"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descreva a tarefa em detalhes..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Prioridade</InputLabel>
                                <Select
                                    value={priority}
                                    label="Prioridade"
                                    onChange={(e) =>
                                        setPriority(e.target.value as CardPriority)
                                    }
                                >
                                    {priorities.map((p) => (
                                        <MenuItem key={p.value} value={p.value}>
                                            {p.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Data Limite"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth disabled={loadingUsers}>
                                <InputLabel>Responsáveis</InputLabel>
                                <Select
                                    multiple
                                    value={assignees}
                                    label="Responsáveis"
                                    onChange={(e) =>
                                        setAssignees(e.target.value as number[])
                                    }
                                    renderValue={(selected) => (
                                        <Box
                                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                                        >
                                            {selected.map((value) => {
                                                const user = users.find((u) => u.id === value);
                                                return user ? (
                                                    <Chip key={value} label={user.name} size="small" />
                                                ) : null;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {loadingUsers ? (
                                        <MenuItem disabled>
                                            <CircularProgress size={20} />
                                        </MenuItem>
                                    ) : (
                                        users.map((user) => (
                                            <MenuItem key={user.id} value={user.id}>
                                                <Box>
                                                    <Typography variant="body2">
                                                        {user.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {user.email}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                multiple
                                options={tags}
                                loading={loadingTags}
                                value={tags.filter((tag) => selectedTags.includes(tag.id))}
                                onChange={(_, newValue) => {
                                    setSelectedTags(newValue.map((tag) => tag.id));
                                }}
                                getOptionLabel={(option) => option.name}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return (
                                            <Chip
                                                key={key}
                                                label={option.name}
                                                size="small"
                                                sx={{
                                                    backgroundColor: option.color,
                                                    color: "#fff",
                                                }}
                                                {...tagProps}
                                            />
                                        );
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Tags"
                                        placeholder="Selecione tags"
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!title.trim()}
                >
                    Salvar Alterações
                </Button>
            </DialogActions>
        </Dialog>
    );
}
