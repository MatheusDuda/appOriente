import { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import {
    MoreVertOutlined,
    EditOutlined,
    PersonAddOutlined,
    DeleteOutlineOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../Common/ConfirmDialog";

type Membro = {
    id: number;
    nome: string;
    avatar?: string;
};

type Equipe = {
    id: number;
    nome: string;
    descricao: string;
    lider: string;
    membros: Membro[];
    projetos: number;
    status: "Ativo" | "Inativo";
};

type EquipeOverflowProps = {
    equipe: Equipe;
};

export default function EquipeOverflow({ equipe }: EquipeOverflowProps) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEditar = () => {
        handleClose();
        navigate(`/equipes/${equipe.id}`);
    };

    const handleAdicionarMembro = () => {
        handleClose();
        navigate(`/equipes/${equipe.id}?action=add-member`);
    };

    const handleExcluir = () => {
        handleClose();
        setConfirmDialog({
            open: true,
            title: "Excluir Equipe",
            message: `Tem certeza que deseja excluir a equipe "${equipe.nome}"? Esta ação não pode ser desfeita.`,
            action: () => {
                console.log("Excluir equipe:", equipe.id);
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
                aria-controls={open ? "equipe-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
            >
                <MoreVertOutlined fontSize="small" />
            </IconButton>

            <Menu
                id="equipe-menu"
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
                    <ListItemText>Editar Equipe</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleAdicionarMembro}>
                    <ListItemIcon>
                        <PersonAddOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Adicionar Membro</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleExcluir} sx={{ color: "error.main" }}>
                    <ListItemIcon sx={{ color: "error.main" }}>
                        <DeleteOutlineOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Excluir Equipe</ListItemText>
                </MenuItem>
            </Menu>

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.action}
                onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
                confirmColor="error"
            />
        </>
    );
}
