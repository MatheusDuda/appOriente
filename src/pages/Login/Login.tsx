import { useState, type FormEvent } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Login() {
    const navigate = useNavigate();
    const { login, loading, error, clearError } = useAuth();
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLocalError(null);
        clearError();

        // Validação simples
        if (!email || !password) {
            setLocalError("Por favor, preencha todos os campos");
            return;
        }

        try {
            await login(email, password);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            // Erro já é tratado no contexto
            console.error("Erro no login:", err);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                // gradiente de topo mais quente para o fundo claro (como o mock)
                background:
                    "linear-gradient(180deg, #CBA28E 0%, #F8F5F2 60%, #F8F5F2 100%)",
            }}
        >
            {/* Marca "Oriente" grande no topo */}
            <Typography
                sx={{
                    mt: { xs: 6, md: 8 },
                    mb: 2,
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    fontSize: { xs: "2.25rem", md: "4rem" },
                    color: "#E8DED6", // puxando da secundǭria clara sobre o topo
                    textTransform: "uppercase",
                }}
            >
                Oriente
            </Typography>

            {/* Card de login */}
            <Paper
                component="form"
                onSubmit={handleSubmit}
                elevation={3}
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    px: 4,
                    py: 4,
                    borderRadius: 3,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.10)", // um pouquinho mais forte que o padrǜo
                }}
            >
                <Typography
                    variant="h5"
                    align="center"
                    sx={{ color: "primary.main", fontWeight: 600, mb: 3 }}
                >
                    Acesse sua Conta
                </Typography>

                {(error || localError) && (
                    <Typography
                        variant="body2"
                        sx={{ color: "error.main", mb: 2, textAlign: "center" }}
                    >
                        {localError || error}
                    </Typography>
                )}

                <TextField
                    fullWidth
                    label="E-mail"
                    variant="filled"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Senha"
                    variant="filled"
                    type={show ? "text" : "password"}
                    placeholder="**************"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    type="button"
                                    onClick={() => setShow((prev) => !prev)}
                                    edge="end"
                                >
                                    {show ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading}
                    sx={{
                        mt: 1,
                        py: 1.2,
                        borderRadius: 2,
                        fontSize: "1.1rem",
                    }}
                >
                    {loading ? "Entrando..." : "Entrar"}
                </Button>

                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Link href="#" underline="hover" sx={{ color: "text.secondary" }}>
                        Esqueci minha senha
                    </Link>
                </Box>
            </Paper>

            {/* RodapǸ */}
            <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 3, mb: 4 }}
            >
                Copyright Oriente 2025. Todos os direitos reservados.
            </Typography>
        </Box>
    );
}
