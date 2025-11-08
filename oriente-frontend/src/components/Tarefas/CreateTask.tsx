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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import type { KanbanColumn, User } from "../../types";
import { CardPriority } from "../../types";
import userService from "../../services/userService";

type CreateTaskProps = {
    open: boolean;
    onClose: () => void;
    onSave: (task: {
        title: string;
        description: string;
        priority: CardPriority;
        assignees: number[];
        dueDate?: string;
        columnId: number;
    }) => void;
    columns: KanbanColumn[];
    projectId?: number;
};

const priorities = [
    { value: CardPriority.URGENT, label: "Urgent" },
    { value: CardPriority.HIGH, label: "High" },
    { value: CardPriority.MEDIUM, label: "Medium" },
    { value: CardPriority.LOW, label: "Low" },
];

export default function CreateTask({ open, onClose, onSave, columns }: CreateTaskProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<CardPriority>(CardPriority.MEDIUM);
    const [assignees, setAssignees] = useState<number[]>([]);
    const [dueDate, setDueDate] = useState("");
    const [columnId, setColumnId] = useState<number>(columns[0]?.id || 0);

    // Users for assignees
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (open) {
            loadUsers();
            // Set default column if available
            if (columns.length > 0 && !columnId) {
                setColumnId(columns[0].id);
            }
        }
    }, [open, columns]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await userService.getUsers(0, 100); // Get first 100 users
            // Filter only active users
            const activeUsers = response.users.filter((user) => user.status === "ACTIVE");
            setUsers(activeUsers);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSave = () => {
        if (title.trim() && columnId) {
            onSave({
                title: title.trim(),
                description: description.trim(),
                priority,
                assignees,
                dueDate: dueDate || undefined,
                columnId,
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setTitle("");
        setDescription("");
        setPriority(CardPriority.MEDIUM);
        setAssignees([]);
        setDueDate("");
        setColumnId(columns[0]?.id || 0);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>New Task</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                autoFocus
                                fullWidth
                                required
                                label="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Implement feature X"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the task in detail..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={priority}
                                    label="Priority"
                                    onChange={(e) => setPriority(e.target.value as CardPriority)}
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
                            <FormControl fullWidth required>
                                <InputLabel>Column</InputLabel>
                                <Select
                                    value={columnId}
                                    label="Column"
                                    onChange={(e) => setColumnId(e.target.value as number)}
                                >
                                    {columns.map((col) => (
                                        <MenuItem key={col.id} value={col.id}>
                                            {col.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth disabled={loadingUsers}>
                                <InputLabel>Assignees</InputLabel>
                                <Select
                                    multiple
                                    value={assignees}
                                    label="Assignees"
                                    onChange={(e) => setAssignees(e.target.value as number[])}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
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
                                                    <Typography variant="body2">{user.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {user.email}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Due Date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!title.trim() || !columnId}
                >
                    Create Task
                </Button>
            </DialogActions>
        </Dialog>
    );
}
