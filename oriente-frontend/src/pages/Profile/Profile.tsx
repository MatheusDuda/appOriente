import { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Button,
    TextField,
    Grid,
    Divider,
    IconButton,
    Chip,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import {
    EditOutlined,
    EmailOutlined,
    PhoneOutlined,
    BusinessOutlined,
    CalendarTodayOutlined,
    BadgeOutlined,
    CameraAltOutlined,
    SaveOutlined,
    CancelOutlined,
} from "@mui/icons-material";

type Usuario = {
    nome: string;
    email: string;
    telefone: string;
    cargo: string;
    departamento: string;
    dataIngresso: string;
    avatar?: string;
    bio: string;
    equipes: string[];
};

const mockUsuario: Usuario = {
    nome: "Lucas Silva",
    email: "lucas.silva@empresa.com",
    telefone: "+55 11 98765-4321",
    cargo: "Desenvolvedor Full Stack",
    departamento: "Tecnologia",
    dataIngresso: "2023-01-15",
    bio: "Desenvolvedor apaixonado por tecnologia e inovação. Especializado em React, Node.js e arquitetura de software.",
    equipes: ["Desenvolvimento Frontend", "Equipe Atlas", "Time de Inovação"],
};

export default function Perfil() {
    const [usuario, setUsuario] = useState<Usuario>(mockUsuario);
    const [editando, setEditando] = useState(false);
    const [formData, setFormData] = useState<Usuario>(mockUsuario);

    const handleEditar = () => {
        setFormData(usuario);
        setEditando(true);
    };

    const handleCancelar = () => {
        setFormData(usuario);
        setEditando(false);
    };

    const handleSalvar = () => {
        setUsuario(formData);
        setEditando(false);
        console.log("Dados salvos:", formData);
    };

    const handleChange = (campo: keyof Usuario, valor: string) => {
        setFormData({ ...formData, [campo]: valor });
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    Meu Perfil
                </Typography>
                {!editando ? (
                    <Button
                        startIcon={<EditOutlined />}
                        variant="contained"
                        onClick={handleEditar}
                    >
                        Editar Perfil
                    </Button>
                ) : (
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            startIcon={<CancelOutlined />}
                            variant="outlined"
                            onClick={handleCancelar}
                        >
                            Cancelar
                        </Button>
                        <Button
                            startIcon={<SaveOutlined />}
                            variant="contained"
                            onClick={handleSalvar}
                        >
                            Salvar
                        </Button>
                    </Box>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Card de Perfil */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
                        <Box sx={{ position: "relative", display: "inline-block", mb: 2 }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    fontSize: 48,
                                    bgcolor: "primary.main",
                                }}
                            >
                                {usuario.nome.charAt(0)}
                            </Avatar>
                            {editando && (
                                <IconButton
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        right: 0,
                                        bgcolor: "primary.main",
                                        color: "primary.contrastText",
                                        "&:hover": { bgcolor: "primary.dark" },
                                    }}
                                    size="small"
                                >
                                    <CameraAltOutlined fontSize="small" />
                                </IconButton>
                            )}
                        </Box>

                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {usuario.nome}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                            {usuario.cargo}
                        </Typography>
                        <Chip
                            label={usuario.departamento}
                            color="primary"
                            size="small"
                            sx={{ mb: 3 }}
                        />

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ textAlign: "left" }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mb: 1, display: "block" }}>
                                EQUIPES
                            </Typography>
                            <List dense>
                                {usuario.equipes.map((equipe, index) => (
                                    <ListItem key={index} sx={{ px: 0 }}>
                                        <ListItemText
                                            primary={equipe}
                                            primaryTypographyProps={{
                                                variant: "body2",
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Paper>
                </Grid>

                {/* Informações Detalhadas */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Informações Pessoais
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <BadgeOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        NOME COMPLETO
                                    </Typography>
                                </Box>
                                {editando ? (
                                    <TextField
                                        fullWidth
                                        value={formData.nome}
                                        onChange={(e) => handleChange("nome", e.target.value)}
                                        size="small"
                                    />
                                ) : (
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.nome}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <EmailOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        E-MAIL
                                    </Typography>
                                </Box>
                                {editando ? (
                                    <TextField
                                        fullWidth
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        size="small"
                                    />
                                ) : (
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.email}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <PhoneOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        TELEFONE
                                    </Typography>
                                </Box>
                                {editando ? (
                                    <TextField
                                        fullWidth
                                        value={formData.telefone}
                                        onChange={(e) => handleChange("telefone", e.target.value)}
                                        size="small"
                                    />
                                ) : (
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.telefone}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <BusinessOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        CARGO
                                    </Typography>
                                </Box>
                                {editando ? (
                                    <TextField
                                        fullWidth
                                        value={formData.cargo}
                                        onChange={(e) => handleChange("cargo", e.target.value)}
                                        size="small"
                                    />
                                ) : (
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.cargo}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <BusinessOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        DEPARTAMENTO
                                    </Typography>
                                </Box>
                                {editando ? (
                                    <TextField
                                        fullWidth
                                        value={formData.departamento}
                                        onChange={(e) => handleChange("departamento", e.target.value)}
                                        size="small"
                                    />
                                ) : (
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {usuario.departamento}
                                    </Typography>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <CalendarTodayOutlined fontSize="small" sx={{ color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                                        DATA DE INGRESSO
                                    </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {new Date(usuario.dataIngresso).toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Sobre
                        </Typography>
                        {editando ? (
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                value={formData.bio}
                                onChange={(e) => handleChange("bio", e.target.value)}
                                placeholder="Conte um pouco sobre você..."
                            />
                        ) : (
                            <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.8 }}>
                                {usuario.bio}
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
