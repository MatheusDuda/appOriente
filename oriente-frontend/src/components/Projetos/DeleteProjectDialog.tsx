import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    Alert,
} from "@mui/material";

type DeleteProjectDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    projectName: string;
    isDeleting: boolean;
};

export default function DeleteProjectDialog({
    open,
    onClose,
    onConfirm,
    projectName,
    isDeleting,
}: DeleteProjectDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Excluir Projeto</DialogTitle>
            <DialogContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Atenção: Esta ação é permanente e não pode ser desfeita!
                </Alert>
                <DialogContentText>
                    Tem certeza que deseja excluir o projeto <strong>"{projectName}"</strong>?
                </DialogContentText>
                <DialogContentText sx={{ mt: 2 }}>
                    Todos os dados relacionados serão excluídos permanentemente:
                </DialogContentText>
                <DialogContentText component="ul" sx={{ mt: 1, pl: 2 }}>
                    <li>Todas as colunas do Kanban</li>
                    <li>Todas as tarefas/cards</li>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isDeleting}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={onConfirm}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Excluindo..." : "Excluir"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
