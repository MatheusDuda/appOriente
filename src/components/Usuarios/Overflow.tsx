import { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import {
    MoreVertOutlined,
    EditOutlined,
    LockOutlined,
    PersonOffOutlined,
    DeleteOutlineOutlined,
} from "@mui/icons-material";
import EditarUsuario from "./EditarUsuario";
import ConfirmDialog from "../Common/ConfirmDialog";
import { useNavigate } from "react-router-dom";

type Usuario = {
    id: number;
    nome: string;
    email: string;
    cargo: string;
    role: "Admin" | "Gerente" | "Membro" | "Visualizador";
    status: "Ativo" | "Inativo";
};

type UsuarioOverflowProps = {
    usuario: Usuario;
};

export default function UsuarioOverflow({ usuario }: UsuarioOverflowProps) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [editarOpen, setEditarOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        action: () => void;
    }>({
        open: false,
        title: "",
        message: "",
        action: () => {},
    });

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEditar = () => {
        handleClose();
        setEditarOpen(true);
    };

    const handleGerenciarPermissoes = () => {
        handleClose();
        navigate("/permissoes", { state: { usuario } });
    };

    const handleDesativar = () => {
        handleClose();
        setConfirmDialog({
            open: true,
            title: "Desativar Usuário",
            message: `Tem certeza que deseja desativar o usuário ${usuario.nome}?`,
            action: () => {
                console.log("Desativar usuário:", usuario.id);
                setConfirmDialog({ ...confirmDialog, open: false });
            },
        });
    };

    const handleExcluir = () => {
        handleClose();
        setConfirmDialog({
            open: true,
            title: "Excluir Usuário",
            message: `Tem certeza que deseja excluir permanentemente o usuário ${usuario.nome}? Esta ação não pode ser desfeita.`,
            action: () => {
                console.log("Excluir usuário:", usuario.id);
                setConfirmDialog({ ...confirmDialog, open: false });
            },
        });
    };

    return (
        <>
            <IconButton
                size="small"
                onClick={handleClick}
                aria-label="Mais opções"
                aria-controls={open ? "usuario-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
            >
                <MoreVertOutlined fontSize="small" />
            </IconButton>

            <Menu
                id="usuario-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                slotProps={{
                    paper: {
                        elevation: 3,
                        sx: { mt: 0.5, minWidth: 200, borderRadius: 2 },
                    },
                }}
            >
                <MenuItem onClick={handleEditar}>
                    <ListItemIcon>
                        <EditOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Editar</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleGerenciarPermissoes}>
                    <ListItemIcon>
                        <LockOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Gerenciar Permissões</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDesativar}>
                    <ListItemIcon>
                        <PersonOffOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        {usuario.status === "Ativo" ? "Desativar" : "Ativar"}
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={handleExcluir} sx={{ color: "error.main" }}>
                    <ListItemIcon sx={{ color: "error.main" }}>
                        <DeleteOutlineOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Excluir</ListItemText>
                </MenuItem>
            </Menu>

            <EditarUsuario
                open={editarOpen}
                onClose={() => setEditarOpen(false)}
                usuario={usuario}
            />

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.action}
                onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
            />
        </>
    );
}
