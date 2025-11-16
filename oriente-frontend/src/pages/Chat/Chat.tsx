import { Box, Paper, Typography } from "@mui/material";
import ListaConversas from "../../components/Chat/ListaConversas";
import AreaMensagens from "../../components/Chat/AreaMensagens";
import { useChat } from "../../contexts/ChatContext";
import type { Chat as ChatType } from "../../types/chat";

export default function Chat() {
  const { chats, selectedChat, selectChat } = useChat();

  const handleSelecionarConversa = async (chat: ChatType) => {
    await selectChat(chat.id);
  };

  return (
    <Box sx={{ height: "calc(100vh - 64px - 48px)", display: "flex", gap: 0 }}>
      <Paper
        sx={{
          width: { xs: "100%", md: 360 },
          display: { xs: selectedChat ? "none" : "flex", md: "flex" },
          flexDirection: "column",
          borderRadius: 0,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <ListaConversas
          conversas={chats}
          conversaSelecionada={selectedChat}
          onSelecionarConversa={handleSelecionarConversa}
        />
      </Paper>

      <Box
        sx={{
          flexGrow: 1,
          display: { xs: selectedChat ? "flex" : "none", md: "flex" },
          flexDirection: "column",
        }}
      >
        {selectedChat ? (
          <AreaMensagens conversa={selectedChat} onVoltar={() => selectChat(0)} />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              bgcolor: "background.default",
            }}
          >
            <Box sx={{ textAlign: "center", color: "text.secondary" }}>
              <Typography variant="h6">Selecione uma conversa</Typography>
              <Typography variant="body2">
                Escolha uma conversa para começar a enviar mensagens
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
