import { useState } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import {
    EditOutlined,
    DeleteOutlined,
    ContentCopyOutlined,
    PersonAddOutlined,
    CalendarTodayOutlined,
    DriveFileMoveOutlined,
    ChevronRightOutlined,
} from "@mui/icons-material";
import type { KanbanColumn } from "../../types";

type OpcoesProps = {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onEditar: () => void;
    onDuplicar: () => void;
    onAdicionarResponsavel: () => void;
    onAlterarData: () => void;
    onExcluir: () => void;
    onMoverParaColuna?: (columnId: number) => void;
    columns?: KanbanColumn[];
    currentColumnId?: number;
};

export default function Opcoes({
    anchorEl,
    open,
    onClose,
    onEditar,
    onDuplicar,
    onAdicionarResponsavel,
    onAlterarData,
    onExcluir,
    onMoverParaColuna,
    columns,
    currentColumnId,
}: OpcoesProps) {
    const [moveMenuAnchorEl, setMoveMenuAnchorEl] = useState<null | HTMLElement>(null);
    const moveMenuOpen = Boolean(moveMenuAnchorEl);

    const handleMoveMenuOpen = (event: React.MouseEvent<HTMLLIElement>) => {
        setMoveMenuAnchorEl(event.currentTarget);
    };

    const handleMoveMenuClose = () => {
        setMoveMenuAnchorEl(null);
    };

    const handleMoveToColumn = (columnId: number) => {
        if (onMoverParaColuna) {
            onMoverParaColuna(columnId);
        }
        handleMoveMenuClose();
        onClose();
    };

    return (
        <>
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

            {columns && columns.length > 0 && (
                <MenuItem onClick={handleMoveMenuOpen}>
                    <ListItemIcon>
                        <DriveFileMoveOutlined fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Mover para...</ListItemText>
                    <ChevronRightOutlined fontSize="small" sx={{ ml: 1 }} />
                </MenuItem>
            )}

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

        {/* Submenu para mover tarefa */}
        <Menu
            anchorEl={moveMenuAnchorEl}
            open={moveMenuOpen}
            onClose={handleMoveMenuClose}
            anchorOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "left",
            }}
            slotProps={{
                paper: {
                    elevation: 3,
                    sx: {
                        minWidth: 200,
                        borderRadius: 2,
                        ml: 0.5,
                    },
                },
            }}
        >
            {columns && columns.filter(col => col.id !== currentColumnId).map((column) => (
                <MenuItem
                    key={column.id}
                    onClick={() => handleMoveToColumn(column.id)}
                >
                    <ListItemText>{column.title}</ListItemText>
                </MenuItem>
            ))}
        </Menu>
        </>
    );
}
