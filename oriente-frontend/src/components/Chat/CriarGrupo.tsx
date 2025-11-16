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
  Checkbox,
  InputAdornment,
  Box,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { useChat } from "../../contexts/ChatContext";
import userService from "../../services/userService";
import type { User } from "../../types";

type CriarGrupoDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function CriarGrupoDialog({ open, onClose }: CriarGrupoDialogProps) {
  const [etapa, setEtapa] = useState<"selecionar" | "nomear">("selecionar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [nomeGrupo, setNomeGrupo] = useState("");
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

      // Remove o usuário logado da lista
      const filteredUsers = data.users.filter(u => u.email !== currentUserEmail);
      setUsuarios(filteredUsers);

      if (filteredUsers.length === 0) {
        setError("Nenhum outro usuário disponível para criar grupo");
      }
    } catch (err: any) {
      console.error("Erro ao carregar usuários:", err);
      setError(err.response?.data?.message || "Erro ao carregar usuários. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleProximo = () => {
    setEtapa("nomear");
  };

  const handleVoltar = () => {
    setEtapa("selecionar");
  };

  const handleCriar = async () => {
    try {
      setError(null);
      await createChat({
        type: "group",
        name: nomeGrupo,
        participant_ids: selectedIds,
      });
      handleFechar();
    } catch (err: any) {
      console.error("Erro ao criar grupo:", err);
      setError(err.response?.data?.message || "Erro ao criar grupo");
    }
  };

  const handleFechar = () => {
    setEtapa("selecionar");
    setSelectedIds([]);
    setNomeGrupo("");
    setSearchTerm("");
    setError(null);
    onClose();
  };

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const membrosSelecionados = usuarios.filter((u) => selectedIds.includes(u.id));

  return (
    <Dialog
      open={open}
      onClose={handleFechar}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{ fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        {etapa === "selecionar" ? "Selecionar Participantes" : "Criar Grupo"}
        <IconButton size="small" onClick={handleFechar} aria-label="Fechar">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {etapa === "selecionar" ? (
          <>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar pessoas..."
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

            {selectedIds.length > 0 && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: "primary.light", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: "primary.dark", fontWeight: 600, mb: 1 }}>
                  {selectedIds.length} {selectedIds.length === 1 ? "pessoa selecionada" : "pessoas selecionadas"}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {membrosSelecionados.map((membro) => (
                    <Chip
                      key={membro.id}
                      label={membro.name}
                      size="small"
                      onDelete={() => handleToggle(membro.id)}
                    />
                  ))}
                </Box>
              </Box>
            )}

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
                        onClick={() => handleToggle(usuario.id)}
                        sx={{
                          borderRadius: 1,
                          gap: 1.5,
                          alignItems: "center",
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        <Checkbox
                          edge="start"
                          checked={selectedIds.includes(usuario.id)}
                          tabIndex={-1}
                          disableRipple
                        />
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
          </>
        ) : (
          <>
            <TextField
              fullWidth
              label="Nome do Grupo"
              placeholder="Ex: Equipe de Projeto"
              value={nomeGrupo}
              onChange={(e) => setNomeGrupo(e.target.value)}
              autoFocus
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Participantes ({selectedIds.length})
            </Typography>

            <List sx={{ maxHeight: 300, overflow: "auto" }}>
              {membrosSelecionados.map((usuario) => (
                <ListItem key={usuario.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.main" }}>{usuario.name.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {usuario.name}
                      </Typography>
                    }
                    secondary={usuario.email}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {etapa === "selecionar" ? (
          <>
            <Button onClick={handleFechar} variant="outlined">
              Cancelar
            </Button>
            <Button onClick={handleProximo} variant="contained" disabled={selectedIds.length < 1}>
              Próximo ({selectedIds.length})
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleVoltar} variant="outlined">
              Voltar
            </Button>
            <Button onClick={handleCriar} variant="contained" disabled={!nomeGrupo.trim()}>
              Criar Grupo
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
