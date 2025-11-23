import { Box, Button, Typography } from "@mui/material";
import { ExploreOff } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Página 404 - Não Encontrado
 * Exibida quando o usuário acessa uma rota que não existe
 */
export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoToDashboard = () => {
    // Se autenticado, vai para o dashboard
    // Se não autenticado, vai para o login
    navigate(isAuthenticated ? "/dashboard" : "/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: (theme) =>
          theme.palette.mode === "light"
            ? "linear-gradient(180deg, #CBA28E 0%, #F8F5F2 60%, #F8F5F2 100%)"
            : "linear-gradient(180deg, #3D332A 0%, #1A1613 60%, #1A1613 100%)",
        px: 2,
      }}
    >
      {/* Logo/Título */}
      <Typography
        variant="h1"
        sx={{
          fontFamily: "Poppins, sans-serif",
          fontSize: { xs: "2.5rem", md: "4rem" },
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 4,
          color: "primary.main",
          mb: 6,
        }}
      >
        Oriente
      </Typography>

      {/* Conteúdo 404 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 500,
        }}
      >
        {/* Ícone */}
        <ExploreOff
          sx={{
            fontSize: { xs: 80, md: 120 },
            color: "primary.main",
            opacity: 0.8,
            mb: 3,
          }}
        />

        {/* Código 404 */}
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: "3rem", md: "4rem" },
            fontWeight: 700,
            color: "text.primary",
            mb: 2,
          }}
        >
          404
        </Typography>

        {/* Mensagem principal */}
        <Typography
          variant="h5"
          sx={{
            fontSize: { xs: "1.25rem", md: "1.5rem" },
            fontWeight: 600,
            color: "text.primary",
            mb: 2,
          }}
        >
          Página não encontrada
        </Typography>

        {/* Mensagem secundária */}
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.95rem", md: "1rem" },
            color: "text.secondary",
            mb: 4,
            lineHeight: 1.7,
          }}
        >
          Parece que você se perdeu... A página que você está procurando não
          existe ou foi movida. Que tal voltar para um local conhecido?
        </Typography>

        {/* Botão de ação */}
        <Button
          variant="contained"
          size="large"
          onClick={handleGoToDashboard}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 3,
            fontWeight: 600,
            fontSize: "1rem",
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(107, 79, 53, 0.25)",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(107, 79, 53, 0.35)",
            },
          }}
        >
          {isAuthenticated ? "Ir para Dashboard" : "Ir para Login"}
        </Button>
      </Box>

      {/* Copyright */}
      <Typography
        variant="body2"
        sx={{
          position: "absolute",
          bottom: 16,
          color: "text.secondary",
          fontSize: "0.875rem",
        }}
      >
        © {new Date().getFullYear()} Oriente - Sistema de Gestão de Projetos
      </Typography>
    </Box>
  );
}
