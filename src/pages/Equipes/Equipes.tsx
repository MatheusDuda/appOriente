import { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActions,
    Avatar,
    AvatarGroup,
    Chip,
    Button,
    TextField,
    InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
    SearchOutlined,
    GroupAddOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import EquipeOverflow from "../../components/Equipes/Overflow";

type Membro = {
    id: number;
    nome: string;
    avatar?: string;
};

type Equipe = {
    id: number;
    nome: string;
    descricao: string;
    lider: string;
    membros: Membro[];
    projetos: number;
    status: "Ativo" | "Inativo";
};

const mockEquipes: Equipe[] = [
    {
        id: 1,
        nome: "Equipe Atlas",
        descricao: "Desenvolvimento de produtos core",
        lider: "João Silva",
        membros: [
            { id: 1, nome: "João Silva" },
            { id: 2, nome: "Maria Santos" },
            { id: 3, nome: "Pedro Costa" },
            { id: 4, nome: "Ana Oliveira" },
        ],
        projetos: 3,
        status: "Ativo",
    },
    {
        id: 2,
        nome: "Equipe Boreal",
        descricao: "Infraestrutura e DevOps",
        lider: "Carlos Lima",
        membros: [
            { id: 5, nome: "Carlos Lima" },
            { id: 6, nome: "Beatriz Rocha" },
            { id: 7, nome: "Rafael Mendes" },
        ],
        projetos: 2,
        status: "Ativo",
    },
    {
        id: 3,
        nome: "Equipe Celeste",
        descricao: "Design e experiência do usuário",
        lider: "Juliana Alves",
        membros: [
            { id: 8, nome: "Juliana Alves" },
            { id: 9, nome: "Lucas Ferreira" },
        ],
        projetos: 1,
        status: "Ativo",
    },
    {
        id: 4,
        nome: "Equipe Delta",
        descricao: "Qualidade e automação de testes",
        lider: "Ana Oliveira",
        membros: [
            { id: 4, nome: "Ana Oliveira" },
            { id: 10, nome: "Roberto Dias" },
            { id: 11, nome: "Fernanda Souza" },
        ],
        projetos: 2,
        status: "Ativo",
    },
    {
        id: 5,
        nome: "Equipe Épsilon",
        descricao: "Marketing e crescimento",
        lider: "Mariana Costa",
        membros: [
            { id: 12, nome: "Mariana Costa" },
        ],
        projetos: 0,
        status: "Inativo",
    },
];

const getStatusColor = (status: Equipe["status"]) => {
    return status === "Ativo" ? "success" : "default";
};

export default function Equipes() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredEquipes = mockEquipes.filter(
        (equipe) =>
            equipe.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            equipe.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            equipe.lider.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleVerEquipe = (equipeId: number) => {
        navigate(`/equipes/${equipeId}`);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Equipes
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Gerencie suas equipes e seus membros
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<GroupAddOutlined />}
                    onClick={() => navigate("/equipes/nova")}
                >
                    Criar Equipe
                </Button>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar por nome, descrição ou líder..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlined />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 3 }}
                />

                <Grid container spacing={3}>
                    {filteredEquipes.map((equipe) => (
                        <Grid key={equipe.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 2, position: "relative" }}>
                                <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
                                    <EquipeOverflow equipe={equipe} />
                                </Box>

                                <CardContent sx={{ flexGrow: 1, pt: 3, pr: 5 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
                                            {equipe.nome}
                                        </Typography>
                                        <Chip
                                            label={equipe.status}
                                            color={getStatusColor(equipe.status)}
                                            size="small"
                                        />
                                    </Box>

                                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                                        {equipe.descricao}
                                    </Typography>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                                            Líder
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {equipe.lider}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
                                            Membros ({equipe.membros.length})
                                        </Typography>
                                        <AvatarGroup max={4} sx={{ justifyContent: "flex-start" }}>
                                            {equipe.membros.map((membro) => (
                                                <Avatar
                                                    key={membro.id}
                                                    sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.875rem" }}
                                                >
                                                    {membro.nome.charAt(0)}
                                                </Avatar>
                                            ))}
                                        </AvatarGroup>
                                    </Box>

                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        {equipe.projetos} {equipe.projetos === 1 ? "projeto" : "projetos"}
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => handleVerEquipe(equipe.id)}
                                    >
                                        Ver Detalhes
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Paper>
        </Box>
    );
}
