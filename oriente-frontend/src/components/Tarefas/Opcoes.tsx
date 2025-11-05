import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import {
    EditOutlined,
    DeleteOutlined,
    ContentCopyOutlined,
    ArchiveOutlined,
    PersonAddOutlined,
    CalendarTodayOutlined,
} from "@mui/icons-material";

type OpcoesProps = {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onEditar: () => void;
    onDuplicar: () => void;
    onArquivar: () => void;
    onAdicionarResponsavel: () => void;
    onAlterarData: () => void;
    onExcluir: () => void;
};

export default function Opcoes({
    anchorEl,
    open,
    onClose,
    onEditar,
    onDuplicar,
    onArquivar,
    onAdicionarResponsavel,
    onAlterarData,
    onExcluir,
}: OpcoesProps) {
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
                    onEditar();
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
                    onDuplicar();
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
                    onAdicionarResponsavel();
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
                    onAlterarData();
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
                    onArquivar();
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
                    onExcluir();
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
