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
    FileDownloadOutlined,
    FilterListOutlined,
    AssessmentOutlined,
} from "@mui/icons-material";
import Filtros from "../../components/Relatorios/Filtros";
import api from "../../services/api";

type Relatorio = {
    id: number;
    nome: string;
    tipo: string;
    projeto: string;
    dataCriacao: string;
    status: "Concluído" | "Em andamento" | "Pendente";
    autor: string;
};

const mockData: Relatorio[] = [];

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
    const [downloading, setDownloading] = useState(false);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDownloadMyReport = async () => {
        try {
            setDownloading(true);

            // Fazer chamada para o endpoint de download
            const response = await api.get('/api/reports/user/me/efficiency/download', {
                responseType: 'blob', // Importante para download de arquivos
                params: {
                    period_preset: 'last_month' // Último mês como padrão
                }
            });

            // Criar URL temporária para o blob
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Criar link temporário e fazer download
            const link = document.createElement('a');
            link.href = url;
            link.download = `relatorio_eficiencia_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Limpar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Erro ao baixar relatório:', error);

            // Tratamento específico por tipo de erro
            let errorMessage = 'Erro ao baixar relatório. Por favor, tente novamente.';

            if (error.response) {
                // Se a resposta for um blob de erro, tentar ler como texto
                if (error.response.data instanceof Blob) {
                    try {
                        const errorText = await error.response.data.text();
                        const errorData = JSON.parse(errorText);
                        console.error('Erro detalhado do backend:', errorData);
                        errorMessage = `Erro no servidor: ${errorData.detail || errorText}`;
                    } catch (e) {
                        console.error('Não foi possível parsear erro do blob:', e);
                    }
                }

                // Erro de resposta do servidor
                switch (error.response.status) {
                    case 401:
                        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
                        break;
                    case 403:
                        errorMessage = 'Você não tem permissão para gerar este relatório.';
                        break;
                    case 404:
                        errorMessage = 'Relatório não encontrado. Verifique se você possui tarefas no período selecionado.';
                        break;
                    case 500:
                        if (!(error.response.data instanceof Blob)) {
                            errorMessage = `Erro no servidor: ${error.response.data?.detail || 'Tente novamente mais tarde'}`;
                        }
                        break;
                    default:
                        errorMessage = `Erro ${error.response.status}: ${error.response.data?.detail || 'Erro desconhecido'}`;
                }
            } else if (error.request) {
                // Erro de rede/conexão
                errorMessage = 'Erro de conexão. Verifique se o servidor está rodando e tente novamente.';
            }

            alert(errorMessage);
        } finally {
            setDownloading(false);
        }
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
                    <Button
                        variant="contained"
                        startIcon={<AssessmentOutlined />}
                        onClick={handleDownloadMyReport}
                        disabled={downloading}
                    >
                        {downloading ? 'Gerando...' : 'Meu Relatório (PDF)'}
                    </Button>
                    <Button variant="outlined" startIcon={<FileDownloadOutlined />}>
                        Exportar
                    </Button>
                </Stack>
            </Box>

            {filtrosOpen && <Filtros onClose={() => setFiltrosOpen(false)} />}

            <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "action.hover" }}>
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
