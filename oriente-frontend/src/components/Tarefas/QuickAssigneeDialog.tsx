import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";
import type { User } from "../../types";
import userService from "../../services/userService";

type QuickAssigneeDialogProps = {
    open: boolean;
    onClose: () => void;
    onSave: (userId: number) => void;
    currentAssigneeId?: number;
};

export default function QuickAssigneeDialog({
    open,
    onClose,
    onSave,
    currentAssigneeId,
}: QuickAssigneeDialogProps) {
    const [selectedUserId, setSelectedUserId] = useState<number | "">(currentAssigneeId || "");
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (open) {
            loadUsers();
            setSelectedUserId(currentAssigneeId || "");
        }
    }, [open, currentAssigneeId]);

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

    const handleSave = () => {
        if (selectedUserId) {
            onSave(selectedUserId as number);
            setSelectedUserId("");
        }
    };

    const handleClose = () => {
        setSelectedUserId("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Atribuir Responsável</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <FormControl fullWidth disabled={loadingUsers}>
                        <InputLabel>Responsável</InputLabel>
                        <Select
                            value={selectedUserId}
                            label="Responsável"
                            onChange={(e) => setSelectedUserId(e.target.value as number)}
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
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!selectedUserId}
                >
                    Atribuir
                </Button>
            </DialogActions>
        </Dialog>
    );
}
