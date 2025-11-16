import { useEffect, useRef, useState } from "react";
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Avatar,
    Typography,
    Badge,
} from "@mui/material";
import {
    SendOutlined,
    AttachFileOutlined,
    MoreVertOutlined,
    ArrowBackOutlined,
    DoneAllOutlined,
} from "@mui/icons-material";
import type {Conversa} from "../../types/chat";

type AreaMensagensProps = {
    conversa: Conversa;
    onEnviarMensagem: (texto: string) => void;
    onVoltar: () => void;
};

export default function AreaMensagens({ conversa, onEnviarMensagem, onVoltar }: AreaMensagensProps) {
    const [mensagemTexto, setMensagemTexto] = useState("");
    const mensagensEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversa.mensagens]);

    const handleEnviar = () => {
        if (mensagemTexto.trim()) {
            onEnviarMensagem(mensagemTexto);
            setMensagemTexto("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleEnviar();
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default" }}>
            {/* Header */}
            <Paper
                sx={{
                    p: 2,
                    borderRadius: 0,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
            >
                <IconButton
                    size="small"
                    onClick={onVoltar}
                    sx={{ display: { xs: "inline-flex", md: "none" } }}
                    aria-label="Voltar"
                >
                    <ArrowBackOutlined />
                </IconButton>

                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                    sx={{
                        "& .MuiBadge-badge": {
                            bgcolor: conversa.online ? "success.main" : "grey.400",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: "background.paper",
                        },
                    }}
                >
                    <Avatar sx={{ bgcolor: "primary.main" }}>{conversa.nome.charAt(0)}</Avatar>
                </Badge>

                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {conversa.nome}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {conversa.online ? "Online" : "Offline"}
                    </Typography>
                </Box>

                <IconButton size="small" aria-label="Mais opções">
                    <MoreVertOutlined />
                </IconButton>
            </Paper>

            {/* Área de mensagens */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    backgroundImage: `linear-gradient(to bottom, rgba(245, 245, 247, 0.3), rgba(245, 245, 247, 0.05))`,
                }}
            >
                {conversa.mensagens.map((mensagem) => {
                    const isUsuario = mensagem.remetente === "Você";

                    return (
                        <Box
                            key={mensagem.id}
                            sx={{
                                display: "flex",
                                justifyContent: isUsuario ? "flex-end" : "flex-start",
                                gap: 1,
                            }}
                        >
                            {!isUsuario && conversa.tipo === "grupo" && (
                                <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: "0.875rem" }}>
                                    {mensagem.remetente.charAt(0)}
                                </Avatar>
                            )}

                            <Box sx={{ maxWidth: "60%" }}>
                                {!isUsuario && conversa.tipo === "grupo" && (
                                    <Typography variant="caption" sx={{ color: "text.secondary", ml: 1.5 }}>
                                        {mensagem.remetente}
                                    </Typography>
                                )}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        bgcolor: isUsuario ? "primary.main" : "background.paper",
                                        color: isUsuario ? "primary.contrastText" : "text.primary",
                                        borderRadius: 2,
                                        borderTopRightRadius: isUsuario ? 0 : 2,
                                        borderTopLeftRadius: isUsuario ? 2 : 0,
                                        boxShadow: isUsuario ? "0 2px 8px rgba(139, 107, 71, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            transform: "translateY(-1px)",
                                            boxShadow: isUsuario ? "0 4px 12px rgba(139, 107, 71, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.12)",
                                        },
                                    }}
                                >
                                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                                        {mensagem.texto}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            justifyContent: "flex-end",
                                            mt: 0.5,
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: "0.7rem",
                                                color: isUsuario ? "primary.contrastText" : "text.secondary",
                                                opacity: isUsuario ? 0.7 : 1,
                                            }}
                                        >
                                            {mensagem.timestamp}
                                        </Typography>
                                        {isUsuario && (
                                            <DoneAllOutlined
                                                sx={{
                                                    fontSize: 14,
                                                    color: mensagem.lida ? "info.light" : "primary.contrastText",
                                                    opacity: mensagem.lida ? 1 : 0.7,
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            </Box>
                        </Box>
                    );
                })}
                <div ref={mensagensEndRef} />
            </Box>

            {/* Input de mensagem */}
            <Paper
                elevation={4}
                sx={{
                    p: 2,
                    borderRadius: 0,
                    borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                    bgcolor: "background.paper",
                }}
            >
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                    <IconButton
                        size="small"
                        aria-label="Anexar arquivo"
                        sx={{
                            color: "text.secondary",
                            "&:hover": { color: "primary.main" }
                        }}
                    >
                        <AttachFileOutlined />
                    </IconButton>

                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Digite uma mensagem..."
                        value={mensagemTexto}
                        onChange={(e) => setMensagemTexto(e.target.value)}
                        onKeyPress={handleKeyPress}
                        variant="outlined"
                        size="small"
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 3,
                                bgcolor: "background.default",
                                "&:hover": {
                                    bgcolor: "action.hover",
                                },
                                "&.Mui-focused": {
                                    bgcolor: "background.paper",
                                },
                            },
                        }}
                    />

                    <IconButton
                        color="primary"
                        onClick={handleEnviar}
                        disabled={!mensagemTexto.trim()}
                        aria-label="Enviar mensagem"
                        sx={{
                            bgcolor: mensagemTexto.trim() ? "primary.main" : "transparent",
                            color: mensagemTexto.trim() ? "primary.contrastText" : "action.disabled",
                            "&:hover": {
                                bgcolor: mensagemTexto.trim() ? "primary.dark" : "transparent",
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        <SendOutlined />
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
}
