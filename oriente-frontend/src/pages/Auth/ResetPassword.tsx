import { useMemo, useState, type FormEvent } from "react";
import {
    Alert,
    Box,
    Button,
    IconButton,
    InputAdornment,
    Link,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import AuthLayout from "../../layouts/AuthLayout";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = useMemo(() => params.get("token") ?? "", [params]);
    const [show1, setShow1] = useState(false);
    const [show2, setShow2] = useState(false);
    const [pwd, setPwd] = useState("");
    const [pwd2, setPwd2] = useState("");
    const [ok, setOk] = useState(false);

    const tooShort = pwd.length > 0 && pwd.length < 8;
    const mismatch = pwd2.length > 0 && pwd !== pwd2;
    const disabled = !pwd || !pwd2 || tooShort || mismatch || !token;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // TODO: chamar FastAPI: POST /auth/reset-password { token, password: pwd }
        setOk(true);
    };

    return (
        <AuthLayout>
            <Paper
                component="form"
                onSubmit={handleSubmit}
                elevation={3}
                sx={{
                    px: 4,
                    py: 4,
                    borderRadius: 3,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                    width: "100%",
                }}
            >
                <Typography
                    variant="h5"
                    align="center"
                    sx={{ color: "primary.main", fontWeight: 600, mb: 3 }}
                >
                    Redefinir senha
                </Typography>

                {!token && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Link invalido ou expirado. Solicite novamente em "Esqueci minha senha".
                    </Alert>
                )}

                {ok && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Senha alterada com sucesso. Voce ja pode entrar com a nova senha.
                    </Alert>
                )}
                <TextField
                    fullWidth
                    label="Nova senha"
                    type={show1 ? "text" : "password"}
                    value={pwd}
                    onChange={(event) => setPwd(event.target.value)}
                    sx={{ mb: 1.5 }}
                    placeholder="********"
                    required
                    helperText={tooShort ? "Minimo de 8 caracteres" : " "}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    type="button"
                                    onClick={() => setShow1((prev) => !prev)}
                                    edge="end"
                                >
                                    {show1 ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    fullWidth
                    label="Confirmar nova senha"
                    type={show2 ? "text" : "password"}
                    value={pwd2}
                    onChange={(event) => setPwd2(event.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="********"
                    required
                    error={mismatch}
                    helperText={mismatch ? "As senhas nao coincidem" : " "}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    type="button"
                                    onClick={() => setShow2((prev) => !prev)}
                                    edge="end"
                                >
                                    {show2 ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <Button
                    type="submit"
                    disabled={disabled}
                    fullWidth
                    size="large"
                    variant="contained"
                    color="primary"
                    sx={{ py: 1.2, borderRadius: 2 }}
                >
                    Salvar nova senha
                </Button>

                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Link component={RouterLink} to="/" underline="hover">
                        Voltar ao login
                    </Link>
                </Box>
            </Paper>
        </AuthLayout>
    );
}
