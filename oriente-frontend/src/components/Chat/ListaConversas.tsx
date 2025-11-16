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
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { SearchOutlined, GroupAddOutlined, PersonAddOutlined } from "@mui/icons-material";
import type { Chat } from "../../types/chat";
import CriarGrupoDialog from "./CriarGrupo";
import NovaConversaDialog from "./NovaConversa";
import { useChat } from "../../contexts/ChatContext";

type ListaConversasProps = {
  conversas: Chat[];
  conversaSelecionada: Chat | null;
  onSelecionarConversa: (conversa: Chat) => void;
};

export default function ListaConversas({
  conversas,
  conversaSelecionada,
  onSelecionarConversa,
}: ListaConversasProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [criarGrupoOpen, setCriarGrupoOpen] = useState(false);
  const [novaConversaOpen, setNovaConversaOpen] = useState(false);

  const { isLoadingChats } = useChat();

  const filteredConversas = conversas.filter(
    (conversa) =>
      conversa.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversa.last_message?.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formata timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }
  };

  return (
    <>
      <Box sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Conversas
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Nova Conversa">
              <IconButton size="small" onClick={() => setNovaConversaOpen(true)} aria-label="Nova conversa">
                <PersonAddOutlined />
              </IconButton>
            </Tooltip>
            <Tooltip title="Criar Grupo">
              <IconButton size="small" onClick={() => setCriarGrupoOpen(true)} aria-label="Criar grupo">
                <GroupAddOutlined />
              </IconButton>
            </Tooltip>
          </Box>
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
        {isLoadingChats ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredConversas.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </Typography>
          </Box>
        ) : (
          filteredConversas.map((conversa) => (
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
                  {conversa.type === "group" ? (
                    <AvatarGroup max={2} sx={{ width: 40, height: 40 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                        {conversa.display_name.charAt(0)}
                      </Avatar>
                      <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                        {conversa.display_name.charAt(1)}
                      </Avatar>
                    </AvatarGroup>
                  ) : (
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      sx={{
                        "& .MuiBadge-badge": {
                          bgcolor: "grey.400", // TODO: Implementar status online
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          border: "2px solid",
                          borderColor: "background.paper",
                        },
                      }}
                    >
                      <Avatar sx={{ bgcolor: "primary.main" }}>{conversa.display_name.charAt(0)}</Avatar>
                    </Badge>
                  )}
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {conversa.display_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {conversa.last_message && formatTimestamp(conversa.last_message.created_at)}
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
                          fontWeight: conversa.unread_count > 0 ? 600 : 400,
                        }}
                      >
                        {conversa.last_message
                          ? `${conversa.last_message.sender_name ? `${conversa.last_message.sender_name}: ` : ""}${conversa.last_message.content}`
                          : "Nenhuma mensagem ainda"}
                      </Typography>
                      {conversa.unread_count > 0 && (
                        <Chip
                          label={conversa.unread_count}
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
          ))
        )}
      </List>

      <NovaConversaDialog open={novaConversaOpen} onClose={() => setNovaConversaOpen(false)} />
      <CriarGrupoDialog open={criarGrupoOpen} onClose={() => setCriarGrupoOpen(false)} />
    </>
  );
}
