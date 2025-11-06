import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
} from "@mui/material";
import Grid from "@mui/material/Grid";

type Membro = {
    id: number;
    nome: string;
};

type CriarTarefaProps = {
    open: boolean;
    onClose: () => void;
    onSave: (tarefa: {
        titulo: string;
        descricao: string;
        prioridade: "Alta" | "Média" | "Baixa";
        responsaveis: number[];
        dataLimite?: string;
        tags: string[];
        colunaId: string;
    }) => void;
    colunas: { id: string; titulo: string }[];
};

const mockMembros: Membro[] = [
    { id: 1, nome: "João Silva" },
    { id: 2, nome: "Maria Santos" },
    { id: 3, nome: "Pedro Costa" },
    { id: 4, nome: "Ana Oliveira" },
    { id: 5, nome: "Carlos Lima" },
];

const prioridades: Array<"Alta" | "Média" | "Baixa"> = ["Alta", "Média", "Baixa"];

export default function CriarTarefa({ open, onClose, onSave, colunas }: CriarTarefaProps) {
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prioridade, setPrioridade] = useState<"Alta" | "Média" | "Baixa">("Média");
    const [responsaveis, setResponsaveis] = useState<number[]>([]);
    const [dataLimite, setDataLimite] = useState("");
    const [colunaId, setColunaId] = useState(colunas[0]?.id || "");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleSave = () => {
        if (titulo.trim()) {
            onSave({
                titulo: titulo.trim(),
                descricao: descricao.trim(),
                prioridade,
                responsaveis,
                dataLimite: dataLimite || undefined,
                tags,
                colunaId,
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setTitulo("");
        setDescricao("");
        setPrioridade("Média");
        setResponsaveis([]);
        setDataLimite("");
        setColunaId(colunas[0]?.id || "");
        setTags([]);
        setTagInput("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                autoFocus
                                fullWidth
                                required
                                label="Título"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ex: Implementar funcionalidade X"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Descrição"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Descreva a tarefa em detalhes..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Prioridade</InputLabel>
                                <Select
                                    value={prioridade}
                                    label="Prioridade"
                                    onChange={(e) => setPrioridade(e.target.value as "Alta" | "Média" | "Baixa")}
                                >
                                    {prioridades.map((p) => (
                                        <MenuItem key={p} value={p}>
                                            {p}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Coluna</InputLabel>
                                <Select
                                    value={colunaId}
                                    label="Coluna"
                                    onChange={(e) => setColunaId(e.target.value)}
                                >
                                    {colunas.map((col) => (
                                        <MenuItem key={col.id} value={col.id}>
                                            {col.titulo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Responsáveis</InputLabel>
                                <Select
                                    multiple
                                    value={responsaveis}
                                    label="Responsáveis"
                                    onChange={(e) => setResponsaveis(e.target.value as number[])}
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

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Data Limite"
                                value={dataLimite}
                                onChange={(e) => setDataLimite(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Tags"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Digite uma tag e pressione Enter"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                helperText="Pressione Enter para adicionar uma tag"
                            />
                            {tags.length > 0 && (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                                    {tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            onDelete={() => handleRemoveTag(tag)}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!titulo.trim()}
                >
                    Criar Tarefa
                </Button>
            </DialogActions>
        </Dialog>
    );
}
