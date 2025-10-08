// src/layouts/AuthLayout.tsx
import type { PropsWithChildren } from "react";
import { Box, Typography } from "@mui/material";

export default function AuthLayout({ children }: PropsWithChildren) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "linear-gradient(180deg, #CBA28E 0%, #F8F5F2 60%, #F8F5F2 100%)",
            }}
        >
            <Typography
                sx={{
                    mt: { xs: 6, md: 8 },
                    mb: 2,
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    fontSize: { xs: "2.25rem", md: "4rem" },
                    color: "#E8DED6",
                    textTransform: "uppercase",
                }}
            >
                Oriente
            </Typography>

            <Box sx={{ width: "100%", maxWidth: 420 }}>{children}</Box>

            <Typography variant="body2" sx={{ color: "text.secondary", mt: 3, mb: 4 }}>
                Copyright Oriente 2025. Todos os direitos reservados.
            </Typography>
        </Box>
    );
}
