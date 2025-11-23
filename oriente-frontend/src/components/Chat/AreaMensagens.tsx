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
  Chip,
  Alert,
} from "@mui/material";
import {
  SendOutlined,
  AttachFileOutlined,
  MoreVertOutlined,
  ArrowBackOutlined,
  DoneAllOutlined,
} from "@mui/icons-material";
import { useChat } from "../../contexts/ChatContext";
import type { Chat, ChatMessageAttachment } from "../../types/chat";
import { authService, type UserData } from "../../services/authService";
import chatMessageAttachmentService from "../../services/chatMessageAttachmentService";
import { InsertDriveFileOutlined, DownloadOutlined } from "@mui/icons-material";

type AreaMensagensProps = {
  conversa: Chat;
  onVoltar: () => void;
};

export default function AreaMensagens({ conversa, onVoltar }: AreaMensagensProps) {
  const [mensagemTexto, setMensagemTexto] = useState("");
  const mensagensEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // Estados para gerenciar anexos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages: contextMessages, sendMessage, sendTyping, isLoadingMessages, typingUsers } = useChat();
  const [messages, setMessages] = useState(contextMessages);

  // Atualizar mensagens locais quando o contexto mudar
  useEffect(() => {
    setMessages(contextMessages);
  }, [contextMessages]);

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
    if (!mensagemTexto.trim() && selectedFiles.length === 0) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Enviar mensagem primeiro (com texto ou espaço se só tiver anexos)
      const messageContent = mensagemTexto.trim() || " ";
      const message = await sendMessage(messageContent);

      // Se houver arquivos, fazer upload
      if (selectedFiles.length > 0 && message?.id) {
        const uploadedAttachments: ChatMessageAttachment[] = [];

        for (const file of selectedFiles) {
          try {
            const attachment = await chatMessageAttachmentService.uploadAttachment(
              conversa.id,
              message.id,
              file
            );
            uploadedAttachments.push(attachment);
          } catch (uploadError: any) {
            console.error("Erro ao fazer upload do arquivo:", uploadError);
            setError(`Erro ao enviar ${file.name}: ${uploadError.message || "Erro desconhecido"}`);
          }
        }

        // Atualizar a mensagem local com os anexos
        if (uploadedAttachments.length > 0) {
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === message.id
                ? { ...msg, attachments: uploadedAttachments }
                : msg
            )
          );
        }
      }

      // Limpar campos
      setMensagemTexto("");
      setSelectedFiles([]);
      sendTyping(false);
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      setError(err.message || "Erro ao enviar mensagem");
    } finally {
      setUploading(false);
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

  // Handler para seleção de arquivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const validation = chatMessageAttachmentService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles([...selectedFiles, ...validFiles]);
    }

    if (errors.length > 0) {
      setError(errors.join("; "));
      setTimeout(() => setError(null), 5000);
    }

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    if (event.target) {
      event.target.value = "";
    }
  };

  // Função para remover arquivo selecionado
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
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

                    {/* Anexos da mensagem (somente visualização) */}
                    {mensagem.attachments && mensagem.attachments.length > 0 && (
                      <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {mensagem.attachments.map((attachment: any) => (
                          <Box
                            key={attachment.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              p: 0.75,
                              borderRadius: 1,
                              bgcolor: isUsuario ? "rgba(255,255,255,0.1)" : "action.hover",
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor: isUsuario ? "rgba(255,255,255,0.2)" : "action.selected",
                              },
                            }}
                            onClick={() => chatMessageAttachmentService.downloadAttachment(
                              conversa.id,
                              mensagem.id,
                              attachment.id
                            )}
                          >
                            <InsertDriveFileOutlined
                              sx={{
                                fontSize: 18,
                                color: isUsuario ? "primary.contrastText" : "text.secondary"
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                color: isUsuario ? "primary.contrastText" : "text.primary",
                              }}
                            >
                              {attachment.filename}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "0.65rem",
                                color: isUsuario ? "primary.contrastText" : "text.secondary",
                                opacity: 0.7,
                              }}
                            >
                              {(attachment.file_size / 1024).toFixed(1)} KB
                            </Typography>
                            <DownloadOutlined
                              sx={{
                                fontSize: 16,
                                color: isUsuario ? "primary.contrastText" : "text.secondary"
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    )}

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
        {/* Mensagem de erro */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Preview dos arquivos selecionados */}
        {selectedFiles.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            {selectedFiles.map((file, index) => (
              <Chip
                key={index}
                label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                size="small"
                icon={<AttachFileOutlined />}
                onDelete={() => handleRemoveFile(index)}
                disabled={uploading}
                sx={{
                  maxWidth: "300px",
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt,.zip"
            disabled={uploading}
          />

          <IconButton
            size="small"
            aria-label="Anexar arquivo"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
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
            disabled={uploading}
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
            disabled={(!mensagemTexto.trim() && selectedFiles.length === 0) || uploading}
            aria-label="Enviar mensagem"
            sx={{
              bgcolor: (mensagemTexto.trim() || selectedFiles.length > 0) && !uploading ? "primary.main" : "transparent",
              color: (mensagemTexto.trim() || selectedFiles.length > 0) && !uploading ? "primary.contrastText" : "action.disabled",
              "&:hover": {
                bgcolor: (mensagemTexto.trim() || selectedFiles.length > 0) && !uploading ? "primary.dark" : "transparent",
              },
              transition: "all 0.2s ease",
            }}
          >
            {uploading ? <CircularProgress size={24} /> : <SendOutlined />}
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
