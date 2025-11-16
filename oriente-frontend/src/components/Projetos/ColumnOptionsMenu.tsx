import { useState } from "react";
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from "@mui/material";
import {
    MoreVertOutlined,
    EditOutlined,
    DeleteOutlined,
    ArrowBackOutlined,
    ArrowForwardOutlined,
} from "@mui/icons-material";

type ColumnOptionsMenuProps = {
    onEdit: () => void;
    onDelete: () => void;
    onMoveLeft: () => void;
    onMoveRight: () => void;
    canMoveLeft: boolean;
    canMoveRight: boolean;
};

export default function ColumnOptionsMenu({
    onEdit,
    onDelete,
    onMoveLeft,
    onMoveRight,
    canMoveLeft,
    canMoveRight,
}: ColumnOptionsMenuProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        handleClose();
        onEdit();
    };

    const handleDelete = () => {
        handleClose();
        onDelete();
    };

    const handleMoveLeft = () => {
        handleClose();
        onMoveLeft();
    };

    const handleMoveRight = () => {
        handleClose();
        onMoveRight();
    };

    return (
        <>
            <IconButton
                size="small"
                onClick={handleClick}
                aria-label="opções da coluna"
                aria-controls={open ? 'column-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
            >
                <MoreVertOutlined fontSize="small" />
            </IconButton>
            <Menu
                id="column-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'column-options-button',
                }}
            >
                <MenuItem onClick={handleMoveLeft} disabled={!canMoveLeft}>
                    <ListItemIcon>
                        <ArrowBackOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mover para Esquerda</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMoveRight} disabled={!canMoveRight}>
                    <ListItemIcon>
                        <ArrowForwardOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mover para Direita</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <EditOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Editar</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Excluir</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}
