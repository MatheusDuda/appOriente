import {
    Box,
    Paper,
    TextField,
    MenuItem,
    Button,
    Stack,
    Typography,
    IconButton,
} from "@mui/material";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";

type FiltrosProps = {
    onClose: () => void;
};

const tiposRelatorio = [
    "Todos",
    "Sprint",
    "Performance",
    "Indicadores",
    "Bugs",
    "Backlog",
    "Deploy",
    "Qualidade",
    "Testes",
];

const projetos = [
    "Todos",
    "Projeto Aurora",
    "Projeto Boreal",
    "Projeto Celeste",
];

const statusOptions = [
    "Todos",
    "Concluído",
    "Em andamento",
    "Pendente",
];

export default function Filtros({ onClose }: FiltrosProps) {
    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Filtros de Relatórios
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Fechar filtros">
                    <CloseOutlined fontSize="small" />
                </IconButton>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                    },
                }}
            >
                <TextField
                    select
                    label="Tipo"
                    defaultValue="Todos"
                    variant="outlined"
                    size="small"
                    fullWidth
                >
                    {tiposRelatorio.map((tipo) => (
                        <MenuItem key={tipo} value={tipo}>
                            {tipo}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Projeto"
                    defaultValue="Todos"
                    variant="outlined"
                    size="small"
                    fullWidth
                >
                    {projetos.map((projeto) => (
                        <MenuItem key={projeto} value={projeto}>
                            {projeto}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Status"
                    defaultValue="Todos"
                    variant="outlined"
                    size="small"
                    fullWidth
                >
                    {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                            {status}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label="Período"
                    type="date"
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }} justifyContent="flex-end">
                <Button variant="outlined" onClick={onClose}>
                    Limpar
                </Button>
                <Button variant="contained" startIcon={<SearchOutlined />}>
                    Aplicar Filtros
                </Button>
            </Stack>
        </Paper>
    );
}
