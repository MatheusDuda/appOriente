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

type QuickDateDialogProps = {
    open: boolean;
    onClose: () => void;
    onSave: (date: string) => void;
    currentDate?: string;
};

export default function QuickDateDialog({
    open,
    onClose,
    onSave,
    currentDate,
}: QuickDateDialogProps) {
    const [selectedDate, setSelectedDate] = useState("");

    useEffect(() => {
        if (open) {
            // Format current date if exists
            if (currentDate) {
                setSelectedDate(currentDate.split("T")[0]);
            } else {
                setSelectedDate("");
            }
        }
    }, [open, currentDate]);

    const handleSave = () => {
        if (selectedDate) {
            onSave(selectedDate);
        }
    };

    const handleClose = () => {
        setSelectedDate("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Alterar Data Limite</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <TextField
                        fullWidth
                        type="date"
                        label="Data Limite"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!selectedDate}
                >
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
