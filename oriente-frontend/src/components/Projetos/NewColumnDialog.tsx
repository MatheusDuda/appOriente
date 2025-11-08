import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
} from "@mui/material";

type NewColumnDialogProps = {
    open: boolean;
    onClose: () => void;
    onSave: (title: string, color?: string) => void;
};

export default function NewColumnDialog({ open, onClose, onSave }: NewColumnDialogProps) {
    const [title, setTitle] = useState("");
    const [color, setColor] = useState("#1976d2");

    const handleSave = () => {
        if (title.trim()) {
            onSave(title.trim(), color);
            setTitle("");
            setColor("#1976d2");
            onClose();
        }
    };

    const handleClose = () => {
        setTitle("");
        setColor("#1976d2");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>New Column</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Column Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., In Review, Approved, etc."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSave();
                            }
                        }}
                    />
                    <Box>
                        <TextField
                            fullWidth
                            type="color"
                            label="Column Color (Optional)"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!title.trim()}
                >
                    Create Column
                </Button>
            </DialogActions>
        </Dialog>
    );
}
