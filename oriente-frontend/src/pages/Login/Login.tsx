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
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Validação
        const newErrors = { email: "", password: "" };
        let hasError = false;

        if (!email.trim()) {
            newErrors.email = "E-mail é obrigatório";
            hasError = true;
        } else if (!validateEmail(email)) {
            newErrors.email = "E-mail inválido";
            hasError = true;
        }

        if (!password.trim()) {
            newErrors.password = "Senha é obrigatória";
            hasError = true;
        } else if (password.length < 6) {
            newErrors.password = "Senha deve ter no mínimo 6 caracteres";
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError) return;

        // TODO: trocar por chamada ao FastAPI
        setLoading(true);
        setTimeout(() => {
            login(); // seta token fake
            navigate("/dashboard", { replace: true });
            setLoading(false);
        }, 500);
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

                <TextField
                    fullWidth
                    label="E-mail"
                    variant="filled"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    error={!!errors.email}
                    helperText={errors.email}
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
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    error={!!errors.password}
                    helperText={errors.password}
                    disabled={loading}
                    sx={{ mb: 2 }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    type="button"
                                    onClick={() => setShow((prev) => !prev)}
                                    edge="end"
                                    disabled={loading}
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
                    <Link
                        component={RouterLink}
                        to="/forgot-password"
                        underline="hover"
                        sx={{ color: "text.secondary" }}
                    >
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
