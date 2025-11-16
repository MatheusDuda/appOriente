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
import type {Conversation} from "../../types/chat";

type MessageAreaProps = {
    conversation: Conversation;
    onSendMessage: (text: string) => void;
    onBack: () => void;
};

export default function MessageArea({ conversation, onSendMessage, onBack }: MessageAreaProps) {
    const [messageText, setMessageText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation.mensagens]);

    const handleSend = () => {
        if (messageText.trim()) {
            onSendMessage(messageText);
            setMessageText("");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
                    onClick={onBack}
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
                            bgcolor: conversation.online ? "success.main" : "grey.400",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: "background.paper",
                        },
                    }}
                >
                    <Avatar sx={{ bgcolor: "primary.main" }}>{conversation.nome.charAt(0)}</Avatar>
                </Badge>

                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {conversation.nome}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {conversation.online ? "Online" : "Offline"}
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
                {conversation.mensagens.map((message) => {
                    const isUser = message.remetente === "Você";

                    return (
                        <Box
                            key={message.id}
                            sx={{
                                display: "flex",
                                justifyContent: isUser ? "flex-end" : "flex-start",
                                gap: 1,
                            }}
                        >
                            {!isUser && conversation.tipo === "grupo" && (
                                <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: "0.875rem" }}>
                                    {message.remetente.charAt(0)}
                                </Avatar>
                            )}

                            <Box sx={{ maxWidth: "60%" }}>
                                {!isUser && conversation.tipo === "grupo" && (
                                    <Typography variant="caption" sx={{ color: "text.secondary", ml: 1.5 }}>
                                        {message.remetente}
                                    </Typography>
                                )}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        bgcolor: isUser ? "primary.main" : "background.paper",
                                        color: isUser ? "primary.contrastText" : "text.primary",
                                        borderRadius: 2,
                                        borderTopRightRadius: isUser ? 0 : 2,
                                        borderTopLeftRadius: isUser ? 2 : 0,
                                        boxShadow: isUser ? "0 2px 8px rgba(139, 107, 71, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            transform: "translateY(-1px)",
                                            boxShadow: isUser ? "0 4px 12px rgba(139, 107, 71, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.12)",
                                        },
                                    }}
                                >
                                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                                        {message.texto}
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
                                                color: isUser ? "primary.contrastText" : "text.secondary",
                                                opacity: isUser ? 0.7 : 1,
                                            }}
                                        >
                                            {message.timestamp}
                                        </Typography>
                                        {isUser && (
                                            <DoneAllOutlined
                                                sx={{
                                                    fontSize: 14,
                                                    color: message.lida ? "info.light" : "primary.contrastText",
                                                    opacity: message.lida ? 1 : 0.7,
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Paper>
                            </Box>
                        </Box>
                    );
                })}
                <div ref={messagesEndRef} />
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
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
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
                        onClick={handleSend}
                        disabled={!messageText.trim()}
                        aria-label="Enviar mensagem"
                        sx={{
                            bgcolor: messageText.trim() ? "primary.main" : "transparent",
                            color: messageText.trim() ? "primary.contrastText" : "action.disabled",
                            "&:hover": {
                                bgcolor: messageText.trim() ? "primary.dark" : "transparent",
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
