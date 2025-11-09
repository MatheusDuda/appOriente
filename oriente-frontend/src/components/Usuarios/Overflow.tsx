import { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import {
    MoreVertOutlined,
    EditOutlined,
    LockOutlined,
    PersonOffOutlined,
    CheckCircleOutlined,
} from "@mui/icons-material";
import EditarUsuario from "./EditarUsuario";
import ConfirmDialog from "../Common/ConfirmDialog";
import { useNavigate } from "react-router-dom";
import userService from "../../services/userService";
import type { User } from "../../types";

type UsuarioOverflowProps = {
    user: User;
    onUserUpdated: () => void;
    onUserDeleted: () => void;
    onUserActivated: () => void;
};

export default function UsuarioOverflow({
    user,
    onUserUpdated,
    onUserDeleted,
    onUserActivated,
}: UsuarioOverflowProps) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [editarOpen, setEditarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
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
    const isActive = user.status === "ACTIVE";

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
        navigate("/permissoes", { state: { usuario: user } });
    };

    const handleToggleStatus = () => {
        handleClose();
        if (isActive) {
            setConfirmDialog({
                open: true,
                title: "Desativar Usuário",
                message: `Tem certeza que deseja desativar o usuário ${user.name}?`,
                action: async () => {
                    try {
                        setLoading(true);
                        await userService.deleteUser(user.id);
                        setConfirmDialog({ ...confirmDialog, open: false });
                        onUserDeleted();
                    } catch (error) {
                        console.error("Erro ao desativar usuário:", error);
                    } finally {
                        setLoading(false);
                    }
                },
            });
        } else {
            setConfirmDialog({
                open: true,
                title: "Ativar Usuário",
                message: `Tem certeza que deseja reativar o usuário ${user.name}?`,
                action: async () => {
                    try {
                        setLoading(true);
                        await userService.activateUser(user.id);
                        setConfirmDialog({ ...confirmDialog, open: false });
                        onUserActivated();
                    } catch (error) {
                        console.error("Erro ao ativar usuário:", error);
                    } finally {
                        setLoading(false);
                    }
                },
            });
        }
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
                <MenuItem onClick={handleToggleStatus} disabled={loading}>
                    <ListItemIcon>
                        {isActive ? (
                            <PersonOffOutlined fontSize="small" />
                        ) : (
                            <CheckCircleOutlined fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemText>{isActive ? "Desativar" : "Ativar"}</ListItemText>
                </MenuItem>
            </Menu>

            <EditarUsuario
                open={editarOpen}
                onClose={() => setEditarOpen(false)}
                user={user}
                onUserUpdated={onUserUpdated}
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
