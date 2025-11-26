import { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    Divider,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
} from "@mui/material";
import {
    NotificationsOutlined,
    PaletteOutlined,
    SaveOutlined,
} from "@mui/icons-material";
import { useTheme } from "../../contexts/ThemeContext";

type Configuracoes = {
    notificacoes: {
        push: boolean;
        tarefas: boolean;
        comentarios: boolean;
        mencoes: boolean;
    };
    aparencia: {
        tema: "light" | "dark" | "auto";
    };
};

const configPadrao: Configuracoes = {
    notificacoes: {
        push: true,
        tarefas: true,
        comentarios: true,
        mencoes: true,
    },
    aparencia: {
        tema: "light",
    },
};

export default function Configuracoes() {
    const { mode, setMode } = useTheme();
    const [config, setConfig] = useState<Configuracoes>(configPadrao);
    const [salvo, setSalvo] = useState(false);

    // Sincroniza o tema do context com o estado local
    useEffect(() => {
        setConfig((prev) => ({
            ...prev,
            aparencia: {
                ...prev.aparencia,
                tema: mode,
            },
        }));
    }, [mode]);

    const handleToggle = (
        categoria: keyof Configuracoes,
        campo: string,
        valor: boolean
    ) => {
        setConfig({
            ...config,
            [categoria]: {
                ...config[categoria as keyof Configuracoes],
                [campo]: valor,
            },
        });
        setSalvo(false);
    };

    const handleSelectChange = (
        categoria: keyof Configuracoes,
        campo: string,
        valor: string
    ) => {
        // Se for mudança de tema, atualiza o context imediatamente
        if (categoria === "aparencia" && campo === "tema") {
            setMode(valor as "light" | "dark" | "auto");
        }

        setConfig({
            ...config,
            [categoria]: {
                ...config[categoria as keyof Configuracoes],
                [campo]: valor,
            },
        });
        setSalvo(false);
    };

    const handleSalvar = () => {
        console.log("Configurações salvas:", config);
        setSalvo(true);
        setTimeout(() => setSalvo(false), 3000);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Configurações
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Personalize sua experiência no sistema
                    </Typography>
                </Box>
                <Button
                    startIcon={<SaveOutlined />}
                    variant="contained"
                    onClick={handleSalvar}
                >
                    Salvar Alterações
                </Button>
            </Box>

            {/* Alerta de Sucesso */}
            {salvo && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Configurações salvas com sucesso!
                </Alert>
            )}

            {/* Notificações */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <NotificationsOutlined color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Notificações
                    </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    Escolha como deseja receber notificações sobre atividades no sistema
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.notificacoes.push}
                                onChange={(e) =>
                                    handleToggle("notificacoes", "push", e.target.checked)
                                }
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Notificações push
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Receba notificações em tempo real no navegador
                                </Typography>
                            </Box>
                        }
                    />

                    <Divider />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.notificacoes.tarefas}
                                onChange={(e) =>
                                    handleToggle("notificacoes", "tarefas", e.target.checked)
                                }
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Atualizações de tarefas
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Seja notificado sobre mudanças em suas tarefas
                                </Typography>
                            </Box>
                        }
                    />

                    <Divider />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.notificacoes.comentarios}
                                onChange={(e) =>
                                    handleToggle("notificacoes", "comentarios", e.target.checked)
                                }
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Comentários
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Notificações sobre novos comentários em suas tarefas
                                </Typography>
                            </Box>
                        }
                    />

                    <Divider />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.notificacoes.mencoes}
                                onChange={(e) =>
                                    handleToggle("notificacoes", "mencoes", e.target.checked)
                                }
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    Menções
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    Quando alguém mencionar você em um comentário
                                </Typography>
                            </Box>
                        }
                    />
                </Box>
            </Paper>

            {/* Aparência */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <PaletteOutlined color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Aparência
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>Tema</InputLabel>
                        <Select
                            value={config.aparencia.tema}
                            label="Tema"
                            onChange={(e) =>
                                handleSelectChange("aparencia", "tema", e.target.value)
                            }
                        >
                            <MenuItem value="light">Claro</MenuItem>
                            <MenuItem value="dark">Escuro</MenuItem>
                            <MenuItem value="auto">Automático (seguir sistema)</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

        </Box>
    );
}
