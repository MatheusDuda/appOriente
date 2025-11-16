import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
} from "@mui/material";
import type { KanbanColumn } from "../../types";

type EditColumnDialogProps = {
    open: boolean;
    column: KanbanColumn | null;
    onClose: () => void;
    onSave: (columnId: number, title: string, color: string) => void;
};

export default function EditColumnDialog({ open, column, onClose, onSave }: EditColumnDialogProps) {
    const [title, setTitle] = useState("");
    const [color, setColor] = useState("#1976d2");

    // Atualiza os valores quando a coluna muda
    useEffect(() => {
        if (column) {
            setTitle(column.title);
            setColor(column.color || "#1976d2");
        }
    }, [column]);

    const handleSave = () => {
        if (title.trim() && column) {
            onSave(column.id, title.trim(), color);
            // Let the parent component decide when to close based on success/failure
        }
    };

    const handleClose = () => {
        // Reset to original values
        if (column) {
            setTitle(column.title);
            setColor(column.color || "#1976d2");
        }
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Editar Coluna</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Título da Coluna"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Em Revisão, Aprovado, etc."
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
                            label="Cor da Coluna"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!title.trim()}
                >
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
