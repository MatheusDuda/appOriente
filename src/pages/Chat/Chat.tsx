import { useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import ListaConversas from "../../components/Chat/ListaConversas";
import AreaMensagens from "../../components/Chat/AreaMensagens";
import type { Conversa, Mensagem } from "../../types/chat";

const mockConversas: Conversa[] = [
    {
        id: 1,
        nome: "João Silva",
        ultimaMensagem: "Vamos revisar o código amanhã?",
        timestamp: "10:30",
        naoLidas: 2,
        online: true,
        tipo: "individual",
        mensagens: [
            { id: 1, texto: "Oi João, tudo bem?", remetente: "Você", timestamp: "09:15", lida: true },
            { id: 2, texto: "Tudo ótimo! E você?", remetente: "João Silva", timestamp: "09:16", lida: true },
            { id: 3, texto: "Preciso de ajuda com o código", remetente: "Você", timestamp: "10:20", lida: true },
            { id: 4, texto: "Vamos revisar o código amanhã?", remetente: "João Silva", timestamp: "10:30", lida: false },
        ],
    },
    {
        id: 2,
        nome: "Equipe Atlas",
        ultimaMensagem: "Maria: Reunião às 14h confirmada",
        timestamp: "09:45",
        naoLidas: 5,
        online: false,
        tipo: "grupo",
        mensagens: [
            { id: 1, texto: "Bom dia equipe!", remetente: "Pedro Costa", timestamp: "08:00", lida: true },
            { id: 2, texto: "Bom dia! Alguém pode confirmar a reunião?", remetente: "Você", timestamp: "08:30", lida: true },
            { id: 3, texto: "Reunião às 14h confirmada", remetente: "Maria Santos", timestamp: "09:45", lida: false },
        ],
    },
    {
        id: 3,
        nome: "Ana Oliveira",
        ultimaMensagem: "Os testes estão passando agora",
        timestamp: "Ontem",
        naoLidas: 0,
        online: false,
        tipo: "individual",
        mensagens: [
            { id: 1, texto: "Ana, pode revisar os testes?", remetente: "Você", timestamp: "Ontem 15:20", lida: true },
            { id: 2, texto: "Claro! Vou verificar agora", remetente: "Ana Oliveira", timestamp: "Ontem 15:25", lida: true },
            { id: 3, texto: "Os testes estão passando agora", remetente: "Ana Oliveira", timestamp: "Ontem 16:30", lida: true },
        ],
    },
    {
        id: 4,
        nome: "Projeto Boreal",
        ultimaMensagem: "Carlos: Deploy realizado com sucesso",
        timestamp: "Ontem",
        naoLidas: 0,
        online: false,
        tipo: "grupo",
        mensagens: [
            { id: 1, texto: "Precisamos fazer o deploy hoje", remetente: "Você", timestamp: "Ontem 10:00", lida: true },
            { id: 2, texto: "Já estou preparando", remetente: "Carlos Lima", timestamp: "Ontem 10:15", lida: true },
            { id: 3, texto: "Deploy realizado com sucesso", remetente: "Carlos Lima", timestamp: "Ontem 14:00", lida: true },
        ],
    },
    {
        id: 5,
        nome: "Beatriz Rocha",
        ultimaMensagem: "Obrigada pela ajuda!",
        timestamp: "Seg",
        naoLidas: 0,
        online: true,
        tipo: "individual",
        mensagens: [
            { id: 1, texto: "Oi Bia, precisa de ajuda com a sprint?", remetente: "Você", timestamp: "Seg 09:00", lida: true },
            { id: 2, texto: "Sim! Pode me explicar o backlog?", remetente: "Beatriz Rocha", timestamp: "Seg 09:15", lida: true },
            { id: 3, texto: "Obrigada pela ajuda!", remetente: "Beatriz Rocha", timestamp: "Seg 11:30", lida: true },
        ],
    },
];

export default function Chat() {
    const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(mockConversas[0]);
    const [conversas, setConversas] = useState<Conversa[]>(mockConversas);

    const handleSelecionarConversa = (conversa: Conversa) => {
        setConversaSelecionada(conversa);
        // Marcar como lida
        setConversas(
            conversas.map((c) =>
                c.id === conversa.id ? { ...c, naoLidas: 0 } : c
            )
        );
    };

    const handleEnviarMensagem = (texto: string) => {
        if (!conversaSelecionada || !texto.trim()) return;

        const novaMensagem: Mensagem = {
            id: Date.now(),
            texto,
            remetente: "Você",
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            lida: false,
        };

        setConversas(
            conversas.map((c) =>
                c.id === conversaSelecionada.id
                    ? {
                          ...c,
                          mensagens: [...c.mensagens, novaMensagem],
                          ultimaMensagem: texto,
                          timestamp: "Agora",
                      }
                    : c
            )
        );

        setConversaSelecionada({
            ...conversaSelecionada,
            mensagens: [...conversaSelecionada.mensagens, novaMensagem],
        });
    };

    return (
        <Box sx={{ height: "calc(100vh - 64px - 48px)", display: "flex", gap: 0 }}>
            <Paper
                sx={{
                    width: { xs: "100%", md: 360 },
                    display: { xs: conversaSelecionada ? "none" : "flex", md: "flex" },
                    flexDirection: "column",
                    borderRadius: 0,
                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                }}
            >
                <ListaConversas
                    conversas={conversas}
                    conversaSelecionada={conversaSelecionada}
                    onSelecionarConversa={handleSelecionarConversa}
                />
            </Paper>

            <Box
                sx={{
                    flexGrow: 1,
                    display: { xs: conversaSelecionada ? "flex" : "none", md: "flex" },
                    flexDirection: "column",
                }}
            >
                {conversaSelecionada ? (
                    <AreaMensagens
                        conversa={conversaSelecionada}
                        onEnviarMensagem={handleEnviarMensagem}
                        onVoltar={() => setConversaSelecionada(null)}
                    />
                ) : (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            bgcolor: "background.default",
                        }}
                    >
                        <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                            <Typography variant="h6">Selecione uma conversa</Typography>
                            <Typography variant="body2">
                                Escolha uma conversa para começar a enviar mensagens
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
