import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import {
    EditOutlined,
    DeleteOutlined,
    ContentCopyOutlined,
    ArchiveOutlined,
    PersonAddOutlined,
    CalendarTodayOutlined,
} from "@mui/icons-material";

type TaskOptionsProps = {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onArchive: () => void;
    onAddAssignee: () => void;
    onChangeDate: () => void;
    onDelete: () => void;
};

export default function TaskOptions({
    anchorEl,
    open,
    onClose,
    onEdit,
    onDuplicate,
    onArchive,
    onAddAssignee,
    onChangeDate,
    onDelete,
}: TaskOptionsProps) {
    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            slotProps={{
                paper: {
                    elevation: 3,
                    sx: {
                        minWidth: 220,
                        borderRadius: 2,
                        mt: 1,
                    },
                },
            }}
        >
            <MenuItem
                onClick={() => {
                    onEdit();
                    onClose();
                }}
            >
                <ListItemIcon>
                    <EditOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Editar tarefa</ListItemText>
            </MenuItem>

            <MenuItem
                onClick={() => {
                    onDuplicate();
                    onClose();
                }}
            >
                <ListItemIcon>
                    <ContentCopyOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Duplicar tarefa</ListItemText>
            </MenuItem>

            <MenuItem
                onClick={() => {
                    onAddAssignee();
                    onClose();
                }}
            >
                <ListItemIcon>
                    <PersonAddOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Adicionar responsável</ListItemText>
            </MenuItem>

            <MenuItem
                onClick={() => {
                    onChangeDate();
                    onClose();
                }}
            >
                <ListItemIcon>
                    <CalendarTodayOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Alterar data limite</ListItemText>
            </MenuItem>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
                onClick={() => {
                    onArchive();
                    onClose();
                }}
            >
                <ListItemIcon>
                    <ArchiveOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText>Arquivar</ListItemText>
            </MenuItem>

            <MenuItem
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                sx={{ color: "error.main" }}
            >
                <ListItemIcon>
                    <DeleteOutlined fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Excluir tarefa</ListItemText>
            </MenuItem>
        </Menu>
    );
}
