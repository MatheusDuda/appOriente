import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    Alert,
} from "@mui/material";

type DeleteColumnDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (columnId: number) => void;
    columnId: number | null;
    columnTitle: string;
    hasCards: boolean;
};

export default function DeleteColumnDialog({
    open,
    onClose,
    onConfirm,
    columnId,
    columnTitle,
    hasCards,
}: DeleteColumnDialogProps) {
    const handleConfirm = () => {
        if (columnId !== null) {
            onConfirm(columnId);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Excluir Coluna</DialogTitle>
            <DialogContent>
                {hasCards ? (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Esta coluna contém tarefas e não pode ser excluída.
                        </Alert>
                        <DialogContentText>
                            A coluna <strong>"{columnTitle}"</strong> possui tarefas.
                            Mova ou exclua todas as tarefas antes de excluir a coluna.
                        </DialogContentText>
                    </>
                ) : (
                    <DialogContentText>
                        Tem certeza que deseja excluir a coluna <strong>"{columnTitle}"</strong>?
                        Esta ação não poderá ser desfeita.
                    </DialogContentText>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    {hasCards ? "Fechar" : "Cancelar"}
                </Button>
                {!hasCards && (
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirm}
                    >
                        Excluir
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
