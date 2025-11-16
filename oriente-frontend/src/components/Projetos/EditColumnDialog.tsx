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

type EditColumnDialogProps = {
    open: boolean;
    onClose: () => void;
    onSave: (columnId: number, title: string, color?: string) => void;
    columnId: number | null;
    initialTitle: string;
    initialColor: string;
};

export default function EditColumnDialog({
    open,
    onClose,
    onSave,
    columnId,
    initialTitle,
    initialColor,
}: EditColumnDialogProps) {
    const [title, setTitle] = useState(initialTitle);
    const [color, setColor] = useState(initialColor);

    // Atualiza os valores quando o dialog abre com nova coluna
    useEffect(() => {
        setTitle(initialTitle);
        setColor(initialColor);
    }, [initialTitle, initialColor, open]);

    const handleSave = () => {
        if (title.trim() && columnId !== null) {
            onSave(columnId, title.trim(), color);
            // Let the parent component decide when to close based on success/failure
        }
    };

    const handleClose = () => {
        setTitle(initialTitle);
        setColor(initialColor);
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
