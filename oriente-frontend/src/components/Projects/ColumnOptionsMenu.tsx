import { useState } from "react";
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from "@mui/material";
import {
    MoreVertOutlined,
    EditOutlined,
    DeleteOutlined,
    ArrowBackOutlined,
    ArrowForwardOutlined,
} from "@mui/icons-material";
import type { KanbanColumn } from "../../types";

type ColumnOptionsMenuProps = {
    column: KanbanColumn;
    isFirstColumn: boolean;
    isLastColumn: boolean;
    onEdit: (column: KanbanColumn) => void;
    onMoveLeft: (column: KanbanColumn) => void;
    onMoveRight: (column: KanbanColumn) => void;
    onDelete: (column: KanbanColumn) => void;
};

export default function ColumnOptionsMenu({
    column,
    isFirstColumn,
    isLastColumn,
    onEdit,
    onMoveLeft,
    onMoveRight,
    onDelete,
}: ColumnOptionsMenuProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        handleClose();
        onEdit(column);
    };

    const handleMoveLeft = () => {
        handleClose();
        onMoveLeft(column);
    };

    const handleMoveRight = () => {
        handleClose();
        onMoveRight(column);
    };

    const handleDeleteClick = () => {
        handleClose();
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        setDeleteDialogOpen(false);
        onDelete(column);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const hasCards = column.cards && column.cards.length > 0;

    return (
        <>
            <IconButton
                size="small"
                onClick={handleClick}
                sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
            >
                <MoreVertOutlined fontSize="small" />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <EditOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Editar</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleMoveLeft} disabled={isFirstColumn}>
                    <ListItemIcon>
                        <ArrowBackOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mover para Esquerda</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleMoveRight} disabled={isLastColumn}>
                    <ListItemIcon>
                        <ArrowForwardOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mover para Direita</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDeleteClick} disabled={hasCards}>
                    <ListItemIcon>
                        <DeleteOutlined fontSize="small" color={hasCards ? "disabled" : "error"} />
                    </ListItemIcon>
                    <ListItemText sx={{ color: hasCards ? "text.disabled" : "error.main" }}>
                        Deletar
                    </ListItemText>
                </MenuItem>
            </Menu>

            {/* Dialog de confirmação de exclusão */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja deletar a coluna "<strong>{column.title}</strong>"?
                        Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancelar</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Deletar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
