import { useState } from "react";
import {
    Box,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Badge,
    Chip,
    Typography,
    IconButton,
    AvatarGroup,
} from "@mui/material";
import { SearchOutlined, GroupAddOutlined } from "@mui/icons-material";
import type {Conversa} from "../../types/chat";
import CriarGrupoDialog from "./CriarGrupo";

type ListaConversasProps = {
    conversas: Conversa[];
    conversaSelecionada: Conversa | null;
    onSelecionarConversa: (conversa: Conversa) => void;
};

export default function ListaConversas({
    conversas,
    conversaSelecionada,
    onSelecionarConversa,
}: ListaConversasProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [criarGrupoOpen, setCriarGrupoOpen] = useState(false);

    const filteredConversas = conversas.filter(
        (conversa) =>
            conversa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conversa.ultimaMensagem.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Box sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Conversas
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => setCriarGrupoOpen(true)}
                        aria-label="Criar grupo"
                    >
                        <GroupAddOutlined />
                    </IconButton>
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlined fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

                        <List sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
                {filteredConversas.map((conversa) => (
                    <ListItem
                        key={conversa.id}
                        disablePadding
                        sx={{
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            "&:last-of-type": { borderBottom: "none" },
                        }}
                    >
                        <ListItemButton
                            selected={conversaSelecionada?.id === conversa.id}
                            onClick={() => onSelecionarConversa(conversa)}
                            sx={{
                                "&.Mui-selected": {
                                    bgcolor: "action.selected",
                                },
                                "&:hover": {
                                    bgcolor: "action.hover",
                                },
                                alignItems: "flex-start",
                                gap: 2,
                                py: 1.5,
                                px: 2,
                            }}
                        >
                            <ListItemAvatar>
                                {conversa.tipo === "grupo" ? (
                                    <AvatarGroup max={2} sx={{ width: 40, height: 40 }}>
                                        <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                                            {conversa.nome.charAt(0)}
                                        </Avatar>
                                        <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                                            {conversa.nome.charAt(1)}
                                        </Avatar>
                                    </AvatarGroup>
                                ) : (
                                    <Badge
                                        overlap="circular"
                                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                        variant="dot"
                                        sx={{
                                            "& .MuiBadge-badge": {
                                                bgcolor: conversa.online ? "success.main" : "grey.400",
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                border: "2px solid",
                                                borderColor: "background.paper",
                                            },
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: "primary.main" }}>
                                            {conversa.nome.charAt(0)}
                                        </Avatar>
                                    </Badge>
                                )}
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {conversa.nome}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            {conversa.timestamp}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                flexGrow: 1,
                                                fontWeight: conversa.naoLidas > 0 ? 600 : 400,
                                            }}
                                        >
                                            {conversa.ultimaMensagem}
                                        </Typography>
                                        {conversa.naoLidas > 0 && (
                                            <Chip
                                                label={conversa.naoLidas}
                                                size="small"
                                                color="primary"
                                                sx={{ height: 20, minWidth: 20, fontSize: "0.75rem", ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                }
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <CriarGrupoDialog open={criarGrupoOpen} onClose={() => setCriarGrupoOpen(false)} />
        </>
    );
}
