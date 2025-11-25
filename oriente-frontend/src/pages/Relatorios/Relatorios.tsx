import { useState } from "react";
import {
    Box,
    Typography,
    Button,
} from "@mui/material";
import {
    AssessmentOutlined,
} from "@mui/icons-material";
import Filtros from "../../components/Relatorios/Filtros";
import api from "../../services/api";

export default function Relatorios() {
    const [downloading, setDownloading] = useState(false);

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
                <Button
                    variant="contained"
                    startIcon={<AssessmentOutlined />}
                    onClick={handleDownloadMyReport}
                    disabled={downloading}
                >
                    {downloading ? 'Gerando...' : 'Meu Relatório (PDF)'}
                </Button>
            </Box>

            <Filtros />
        </Box>
    );
}
