import { useState } from "react";
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
} from "@mui/material";
import Grid from "@mui/material/Grid";

type Member = {
    id: number;
    name: string;
};

type CreateTaskProps = {
    open: boolean;
    onClose: () => void;
    onSave: (task: {
        title: string;
        description: string;
        priority: "High" | "Medium" | "Low";
        assignees: number[];
        dueDate?: string;
        tags: string[];
        columnId: string;
    }) => void;
    columns: { id: string; title: string }[];
};

const mockMembers: Member[] = [
    { id: 1, name: "John Silva" },
    { id: 2, name: "Mary Santos" },
    { id: 3, name: "Pedro Costa" },
    { id: 4, name: "Ana Oliveira" },
    { id: 5, name: "Carlos Lima" },
];

const priorities: Array<"High" | "Medium" | "Low"> = ["High", "Medium", "Low"];

export default function CreateTask({ open, onClose, onSave, columns }: CreateTaskProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
    const [assignees, setAssignees] = useState<number[]>([]);
    const [dueDate, setDueDate] = useState("");
    const [columnId, setColumnId] = useState(columns[0]?.id || "");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleSave = () => {
        if (title.trim()) {
            onSave({
                title: title.trim(),
                description: description.trim(),
                priority,
                assignees,
                dueDate: dueDate || undefined,
                tags,
                columnId,
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setTitle("");
        setDescription("");
        setPriority("Medium");
        setAssignees([]);
        setDueDate("");
        setColumnId(columns[0]?.id || "");
        setTags([]);
        setTagInput("");
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
                                    onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
                                >
                                    {priorities.map((p) => (
                                        <MenuItem key={p} value={p}>
                                            {p}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Column</InputLabel>
                                <Select
                                    value={columnId}
                                    label="Column"
                                    onChange={(e) => setColumnId(e.target.value)}
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
                            <FormControl fullWidth>
                                <InputLabel>Assignees</InputLabel>
                                <Select
                                    multiple
                                    value={assignees}
                                    label="Assignees"
                                    onChange={(e) => setAssignees(e.target.value as number[])}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const member = mockMembers.find((m) => m.id === value);
                                                return member ? (
                                                    <Chip key={value} label={member.name} size="small" />
                                                ) : null;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {mockMembers.map((member) => (
                                        <MenuItem key={member.id} value={member.id}>
                                            {member.name}
                                        </MenuItem>
                                    ))}
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

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Tags"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Type a tag and press Enter"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                helperText="Press Enter to add a tag"
                            />
                            {tags.length > 0 && (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                    {tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            onDelete={() => handleRemoveTag(tag)}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!title.trim()}
                >
                    Create Task
                </Button>
            </DialogActions>
        </Dialog>
    );
}
