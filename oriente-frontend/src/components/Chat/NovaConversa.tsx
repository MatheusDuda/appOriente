import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  InputAdornment,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { useChat } from "../../contexts/ChatContext";
import userService from "../../services/userService";
import type { User } from "../../types";

type NovaConversaDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function NovaConversaDialog({ open, onClose }: NovaConversaDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createChat } = useChat();

  // Carrega usuários quando o dialog abre
  useEffect(() => {
    if (open) {
      loadUsuarios();
    }
  }, [open]);

  const loadUsuarios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userService.getUsers(0, 100);

      // Filtra o usuário logado da lista
      // Pega o email do token JWT armazenado
      const token = localStorage.getItem("auth_token");
      let currentUserEmail = null;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          currentUserEmail = payload.email;
        } catch (e) {
          console.error("Erro ao decodificar token:", e);
        }
      }

      // Filtra usuários removendo o usuário logado
      const filteredUsers = data.users.filter(u => u.email !== currentUserEmail);
      setUsuarios(filteredUsers);

      if (filteredUsers.length === 0) {
        setError("Nenhum outro usuário disponível no momento");
      }
    } catch (err: any) {
      console.error("Erro ao carregar usuários:", err);
      setError(err.response?.data?.message || "Erro ao carregar usuários. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (userId: number) => {
    try {
      setError(null);
      await createChat({
        type: "individual",
        participant_ids: [userId],
      });
      handleClose();
    } catch (err: any) {
      console.error("Erro ao criar conversa:", err);
      setError(err.response?.data?.message || "Erro ao criar conversa");
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setError(null);
    onClose();
  };

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{ fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        Nova Conversa
        <IconButton size="small" onClick={handleClose} aria-label="Fechar">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecione um usuário para iniciar uma conversa
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Buscar usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: "auto" }}>
            {filteredUsuarios.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                </Typography>
              </Box>
            ) : (
              filteredUsuarios.map((usuario) => (
                <ListItem key={usuario.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleSelectUser(usuario.id)}
                    sx={{
                      borderRadius: 1,
                      gap: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: "primary.main" }}>{usuario.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {usuario.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {usuario.email}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
