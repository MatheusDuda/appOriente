import { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Button,
    Stack,
} from "@mui/material";
import {
    VisibilityOutlined,
    FileDownloadOutlined,
    FilterListOutlined,
} from "@mui/icons-material";
import Filtros from "../../components/Relatorios/Filtros";

type Relatorio = {
    id: number;
    nome: string;
    tipo: string;
    projeto: string;
    dataCriacao: string;
    status: "Concluído" | "Em andamento" | "Pendente";
    autor: string;
};

const mockData: Relatorio[] = [
    { id: 1, nome: "Relatório de Sprint #12", tipo: "Sprint", projeto: "Projeto Aurora", dataCriacao: "2025-10-01", status: "Concluído", autor: "João Silva" },
    { id: 2, nome: "Análise de Performance Q3", tipo: "Performance", projeto: "Projeto Boreal", dataCriacao: "2025-09-28", status: "Concluído", autor: "Maria Santos" },
    { id: 3, nome: "Indicadores Trimestrais", tipo: "Indicadores", projeto: "Projeto Celeste", dataCriacao: "2025-09-25", status: "Em andamento", autor: "Pedro Costa" },
    { id: 4, nome: "Relatório de Bugs - Setembro", tipo: "Bugs", projeto: "Projeto Aurora", dataCriacao: "2025-09-20", status: "Concluído", autor: "Ana Oliveira" },
    { id: 5, nome: "Revisão de Backlog", tipo: "Backlog", projeto: "Projeto Boreal", dataCriacao: "2025-09-18", status: "Pendente", autor: "Carlos Lima" },
    { id: 6, nome: "Relatório de Deploy - Sprint 11", tipo: "Deploy", projeto: "Projeto Aurora", dataCriacao: "2025-09-15", status: "Concluído", autor: "João Silva" },
    { id: 7, nome: "Métricas de Código", tipo: "Qualidade", projeto: "Projeto Celeste", dataCriacao: "2025-09-12", status: "Em andamento", autor: "Maria Santos" },
    { id: 8, nome: "Relatório de Testes Automatizados", tipo: "Testes", projeto: "Projeto Boreal", dataCriacao: "2025-09-10", status: "Concluído", autor: "Pedro Costa" },
];

const getStatusColor = (status: Relatorio["status"]) => {
    switch (status) {
        case "Concluído":
            return "success";
        case "Em andamento":
            return "warning";
        case "Pendente":
            return "default";
        default:
            return "default";
    }
};

export default function Relatorios() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filtrosOpen, setFiltrosOpen] = useState(false);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedData = mockData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Relatórios
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Visualize e gerencie todos os relatórios dos seus projetos
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="outlined"
                        startIcon={<FilterListOutlined />}
                        onClick={() => setFiltrosOpen(!filtrosOpen)}
                    >
                        Filtros
                    </Button>
                    <Button variant="contained" startIcon={<FileDownloadOutlined />}>
                        Exportar
                    </Button>
                </Stack>
            </Box>

            {filtrosOpen && <Filtros onClose={() => setFiltrosOpen(false)} />}

            <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "grey.50" }}>
                                <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Projeto</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Data de Criação</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Autor</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedData.map((relatorio) => (
                                <TableRow
                                    key={relatorio.id}
                                    hover
                                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                                >
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {relatorio.nome}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{relatorio.tipo}</TableCell>
                                    <TableCell>{relatorio.projeto}</TableCell>
                                    <TableCell>
                                        {new Date(relatorio.dataCriacao).toLocaleDateString("pt-BR")}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={relatorio.status}
                                            color={getStatusColor(relatorio.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{relatorio.autor}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" aria-label="Visualizar relatório">
                                            <VisibilityOutlined fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="primary" aria-label="Baixar relatório">
                                            <FileDownloadOutlined fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={mockData.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage="Linhas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>
        </Box>
    );
}
