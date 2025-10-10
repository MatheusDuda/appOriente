import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Avatar,
    AvatarGroup,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { ArrowBackOutlined, SaveOutlined } from "@mui/icons-material";

type Membro = {
    id: number;
    nome: string;
};

const mockMembros: Membro[] = [
    { id: 1, nome: "João Silva" },
    { id: 2, nome: "Maria Santos" },
    { id: 3, nome: "Pedro Costa" },
    { id: 4, nome: "Ana Oliveira" },
    { id: 5, nome: "Carlos Lima" },
];

export default function CriarProjeto() {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [lider, setLider] = useState<number | "">("");
    const [membros, setMembros] = useState<number[]>([]);
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    const handleSalvar = () => {
        // Aqui você faria a chamada para API para salvar o projeto
        console.log({
            nome,
            descricao,
            lider,
            membros,
            dataInicio,
            dataFim,
        });
        navigate("/projetos");
    };

    const handleCancelar = () => {
        navigate("/projetos");
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Button
                    startIcon={<ArrowBackOutlined />}
                    onClick={handleCancelar}
                    variant="outlined"
                    size="small"
                >
                    Voltar
                </Button>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Criar Novo Projeto
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Preencha os dados do projeto
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            required
                            label="Nome do Projeto"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Desenvolvimento App Mobile"
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            required
                            multiline
                            rows={4}
                            label="Descrição"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva os objetivos e escopo do projeto"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Data de Início"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Data de Término (Estimada)"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Líder do Projeto</InputLabel>
                            <Select
                                value={lider}
                                label="Líder do Projeto"
                                onChange={(e) => setLider(e.target.value as number)}
                            >
                                {mockMembros.map((membro) => (
                                    <MenuItem key={membro.id} value={membro.id}>
                                        {membro.nome}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>Membros da Equipe</InputLabel>
                            <Select
                                multiple
                                value={membros}
                                label="Membros da Equipe"
                                onChange={(e) => setMembros(e.target.value as number[])}
                                renderValue={(selected) => (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const membro = mockMembros.find((m) => m.id === value);
                                            return membro ? (
                                                <Chip key={value} label={membro.nome} size="small" />
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                            >
                                {mockMembros.map((membro) => (
                                    <MenuItem key={membro.id} value={membro.id}>
                                        {membro.nome}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {membros.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Membros Selecionados ({membros.length})
                                </Typography>
                                <AvatarGroup max={10}>
                                    {membros.map((membroId) => {
                                        const membro = mockMembros.find((m) => m.id === membroId);
                                        return membro ? (
                                            <Avatar
                                                key={membro.id}
                                                sx={{ bgcolor: "primary.main" }}
                                                title={membro.nome}
                                            >
                                                {membro.nome.charAt(0)}
                                            </Avatar>
                                        ) : null;
                                    })}
                                </AvatarGroup>
                            </Box>
                        </Grid>
                    )}
                </Grid>

                <Box sx={{ display: "flex", gap: 2, mt: 4, justifyContent: "flex-end" }}>
                    <Button onClick={handleCancelar} variant="outlined">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSalvar}
                        variant="contained"
                        startIcon={<SaveOutlined />}
                        disabled={!nome || !descricao || !lider}
                    >
                        Criar Projeto
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
