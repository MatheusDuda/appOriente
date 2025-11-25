import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  AvatarGroup,
  Chip,
  Skeleton,
  Alert,
} from "@mui/material";
import { AccessTimeOutlined, FlagOutlined, AssignmentOutlined } from "@mui/icons-material";
import { cardService } from "../../services/cardService";
import type { TaskCardPreviewData, CardPriority } from "../../types/index";

interface TaskCardPreviewProps {
  projectId: string;
  cardId: string;
}

const priorityConfig: Record<CardPriority, { label: string; color: "error" | "warning" | "info" | "success" }> = {
  urgent: { label: "Urgente", color: "error" },
  high: { label: "Alta", color: "warning" },
  medium: { label: "Média", color: "info" },
  low: { label: "Baixa", color: "success" },
};

const statusConfig: Record<string, { label: string; color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" }> = {
  PENDING: { label: "Pendente", color: "warning" },
  IN_PROGRESS: { label: "Em Andamento", color: "info" },
  COMPLETED: { label: "Concluído", color: "success" },
  // Mapeamento dos status antigos
  active: { label: "Pendente", color: "warning" },
  archived: { label: "Arquivado", color: "error" },
  deleted: { label: "Deletado", color: "error" },
};

export default function TaskCardPreview({ projectId, cardId }: TaskCardPreviewProps) {
  const [cardData, setCardData] = useState<TaskCardPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const card = await cardService.getCard(parseInt(projectId), cardId);
        setCardData({
          id: card.id,
          title: card.title,
          description: card.description,
          priority: card.priority,
          status: card.status,
          due_date: card.due_date,
          assignees: card.assignees,
        });
      } catch (err) {
        setError("Erro ao carregar tarefa");
        console.error("Erro ao buscar card para preview:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCardData();
  }, [projectId, cardId]);

  const handleClick = () => {
    navigate(`/projetos/${projectId}/tarefas/${cardId}`);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  const formatDueDate = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    return date.toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ my: 1, maxWidth: "100%" }}>
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error || !cardData) {
    return (
      <Box sx={{ my: 1, maxWidth: "100%" }}>
        <Alert severity="error" sx={{ fontSize: "0.875rem" }}>
          {error || "Tarefa não encontrada"}
        </Alert>
      </Box>
    );
  }

  const priorityInfo = priorityConfig[cardData.priority];

  return (
    <Paper
      elevation={0}
      onClick={handleClick}
      sx={{
        p: 2,
        my: 1,
        bgcolor: "background.paper",
        border: (theme) =>
          `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        cursor: "pointer",
        transition: "all 0.2s ease",
        maxWidth: "100%",
        "&:hover": {
          borderColor: (theme) => theme.palette.primary.main,
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 4px 16px rgba(139, 107, 71, 0.25)"
              : "0 4px 16px rgba(139, 107, 71, 0.15)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ display: "flex", gap: 2 }}>
        {/* Ícone da tarefa */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            minWidth: 40,
            pt: 0.5,
          }}
        >
          <AssignmentOutlined
            sx={{
              color: "primary.main",
              fontSize: 24,
            }}
          />
        </Box>

        {/* Conteúdo do card */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Título */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              color: "text.primary",
              wordBreak: "break-word",
              fontSize: "1rem",
            }}
          >
            {cardData.title}
          </Typography>

          {/* Descrição resumida */}
          {cardData.description && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                display: "block",
                mb: 1,
                wordBreak: "break-word",
                lineHeight: 1.4,
                fontSize: "0.875rem",
              }}
            >
              {truncateText(cardData.description, 80)}
            </Typography>
          )}

          {/* Chips e informações */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 1 }}>
            {/* Prioridade */}
            <Chip
              label={priorityInfo.label}
              size="small"
              color={priorityInfo.color}
              variant="filled"
              sx={{
                height: 26,
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
              icon={<FlagOutlined sx={{ fontSize: 16 }} />}
            />

            {/* Data limite */}
            {cardData.due_date && (
              <Chip
                label={formatDueDate(cardData.due_date)}
                size="small"
                variant="outlined"
                sx={{
                  height: 26,
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
                icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
              />
            )}

            {/* Status */}
            <Chip
              label={statusConfig[cardData.status]?.label || cardData.status}
              size="small"
              color={statusConfig[cardData.status]?.color || "default"}
              variant="filled"
              sx={{
                height: 26,
                fontWeight: 500,
                fontSize: "0.75rem",
              }}
            />
          </Box>

          {/* Responsáveis */}
          {cardData.assignees.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              >
                Atribuído a:
              </Typography>
              <AvatarGroup max={3} sx={{ height: 28 }}>
                {cardData.assignees.map((assignee) => (
                  <Avatar
                    key={assignee.id}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      bgcolor: "primary.main",
                    }}
                    alt={assignee.name}
                    title={assignee.name}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </Avatar>
                ))}
              </AvatarGroup>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
