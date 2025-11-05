import { useState } from "react";
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
} from "@mui/material";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";

type Usuario = {

    id: number;

    nome: string;

    email: string;

    avatar?: string;

};

type CriarGrupoDialogProps = {

    open: boolean;

    onClose: () => void;

};

const usuariosDisponiveis: Usuario[] = [

    { id: 1, nome: "João Silva", email: "joao.silva@oriente.com" },

    { id: 2, nome: "Maria Santos", email: "maria.santos@oriente.com" },

    { id: 3, nome: "Pedro Costa", email: "pedro.costa@oriente.com" },

    { id: 4, nome: "Ana Oliveira", email: "ana.oliveira@oriente.com" },

    { id: 5, nome: "Carlos Lima", email: "carlos.lima@oriente.com" },

    { id: 6, nome: "Beatriz Rocha", email: "beatriz.rocha@oriente.com" },

    { id: 7, nome: "Rafael Mendes", email: "rafael.mendes@oriente.com" },

    { id: 8, nome: "Juliana Alves", email: "juliana.alves@oriente.com" },

];

export default function CriarGrupoDialog({ open, onClose }: CriarGrupoDialogProps) {

    const [etapa, setEtapa] = useState<"selecionar" | "nomear">("selecionar");

    const [searchTerm, setSearchTerm] = useState("");

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [nomeGrupo, setNomeGrupo] = useState("");

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

    const handleCriar = () => {

        console.log("Criar grupo:", { nome: nomeGrupo, membros: selectedIds });

        handleFechar();

    };

    const handleFechar = () => {

        setEtapa("selecionar");

        setSelectedIds([]);

        setNomeGrupo("");

        setSearchTerm("");

        onClose();

    };

    const filteredUsuarios = usuariosDisponiveis.filter(

        (usuario) =>

            usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||

            usuario.email.toLowerCase().includes(searchTerm.toLowerCase())

    );

    const membrosSelecionados = usuariosDisponiveis.filter((u) => selectedIds.includes(u.id));

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

            <DialogTitle sx={{ fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                {etapa === "selecionar" ? "Selecionar Participantes" : "Criar Grupo"}

                <IconButton size="small" onClick={handleFechar} aria-label="Fechar">

                    <CloseOutlined fontSize="small" />

                </IconButton>

            </DialogTitle>

            <DialogContent>

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

                                            label={membro.nome}

                                            size="small"

                                            onDelete={() => handleToggle(membro.id)}

                                        />

                                    ))}

                                </Box>

                            </Box>

                        )}

                        <List sx={{ maxHeight: 400, overflow: "auto" }}>
                            {filteredUsuarios.map((usuario) => (
                                <ListItem
                                    key={usuario.id}
                                    disablePadding
                                    sx={{ mb: 0.5 }}
                                >
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
                                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                                {usuario.nome.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {usuario.nome}
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
                            ))}
                        </List>

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

                                        <Avatar sx={{ bgcolor: "primary.main" }}>

                                            {usuario.nome.charAt(0)}

                                        </Avatar>

                                    </ListItemAvatar>

                                    <ListItemText

                                        primary={

                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>

                                                {usuario.nome}

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

                        <Button

                            onClick={handleProximo}

                            variant="contained"

                            disabled={selectedIds.length < 2}

                        >

                            Próximo ({selectedIds.length})

                        </Button>

                    </>

                ) : (

                    <>

                        <Button onClick={handleVoltar} variant="outlined">

                            Voltar

                        </Button>

                        <Button

                            onClick={handleCriar}

                            variant="contained"

                            disabled={!nomeGrupo.trim()}

                        >

                            Criar Grupo

                        </Button>

                    </>

                )}

            </DialogActions>

        </Dialog>

    );

}
