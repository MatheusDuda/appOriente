import { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Typography,
  Badge,
  CircularProgress,
} from "@mui/material";
import {
  SendOutlined,
  AttachFileOutlined,
  MoreVertOutlined,
  ArrowBackOutlined,
  DoneAllOutlined,
} from "@mui/icons-material";
import { useChat } from "../../contexts/ChatContext";
import type { Chat } from "../../types/chat";
import { authService, type UserData } from "../../services/authService";

type AreaMensagensProps = {
  conversa: Chat;
  onVoltar: () => void;
};

export default function AreaMensagens({ conversa, onVoltar }: AreaMensagensProps) {
  const [mensagemTexto, setMensagemTexto] = useState("");
  const mensagensEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  const { messages, sendMessage, sendTyping, isLoadingMessages, typingUsers } = useChat();

  const scrollToBottom = () => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao buscar usuário logado:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleEnviar = async () => {
    if (mensagemTexto.trim()) {
      await sendMessage(mensagemTexto);
      setMensagemTexto("");
      sendTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMensagemTexto(e.target.value);

    // Envia indicador de digitação
    sendTyping(true);

    // Cancela o timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Para de enviar "digitando" após 3 segundos de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 3000);
  };

  // Formata timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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
              bgcolor: "grey.400", // TODO: Implementar status online
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: "2px solid",
              borderColor: "background.paper",
            },
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main" }}>{conversa.display_name.charAt(0)}</Avatar>
        </Badge>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {conversa.display_name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {typingUsers.size > 0
              ? `${Array.from(typingUsers.values()).join(", ")} está digitando...`
              : conversa.type === "group"
              ? `${conversa.participant_count} participantes`
              : "Online"} {/* TODO: Implementar status online real */}
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
        {isLoadingMessages ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!
            </Typography>
          </Box>
        ) : (
          messages.map((mensagem) => {
            const isUsuario = currentUser ? mensagem.sender_id === currentUser.id : false;

            return (
              <Box
                key={mensagem.id}
                sx={{
                  display: "flex",
                  justifyContent: isUsuario ? "flex-end" : "flex-start",
                  gap: 1,
                }}
              >
                {!isUsuario && conversa.type === "group" && mensagem.sender && (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main", fontSize: "0.875rem" }}>
                    {mensagem.sender.name.charAt(0)}
                  </Avatar>
                )}

                <Box sx={{ maxWidth: "60%" }}>
                  {!isUsuario && conversa.type === "group" && mensagem.sender && (
                    <Typography variant="caption" sx={{ color: "text.secondary", ml: 1.5 }}>
                      {mensagem.sender.name}
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
                      boxShadow: isUsuario
                        ? "0 2px 8px rgba(139, 107, 71, 0.2)"
                        : "0 2px 8px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: isUsuario
                          ? "0 4px 12px rgba(139, 107, 71, 0.3)"
                          : "0 4px 12px rgba(0, 0, 0, 0.12)",
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                      {mensagem.content}
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
                        {formatTimestamp(mensagem.created_at)}
                        {mensagem.is_edited && " (editada)"}
                      </Typography>
                      {isUsuario && (
                        <DoneAllOutlined
                          sx={{
                            fontSize: 14,
                            color: "primary.contrastText",
                            opacity: 0.7,
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            );
          })
        )}
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
              "&:hover": { color: "primary.main" },
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
            onChange={handleInputChange}
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
