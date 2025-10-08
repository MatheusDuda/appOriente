import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Link, Paper, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // TODO: chamar FastAPI: POST /auth/forgot-password { email }
        setSent(true);
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
                    Recuperar acesso
                </Typography>

                {sent && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Enviamos um link de recuperacao para <b>{email}</b>. Verifique a caixa de
                        entrada e o spam.
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="E-mail"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    sx={{ mb: 2 }}
                    required
                />

                <Button
                    type="submit"
                    fullWidth
                    size="large"
                    variant="contained"
                    color="primary"
                    sx={{ py: 1.2, borderRadius: 2 }}
                >
                    Enviar link de recuperacao
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
