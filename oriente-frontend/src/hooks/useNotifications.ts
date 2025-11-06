import { useState, useCallback, useEffect } from "react";
import { notificationsService } from "../services/notificationsService";
import type {
  Notification,
  NotificationFilters,
} from "../types/notifications";

/**
 * Hook customizado para gerenciar estado de notificações
 */
export const useNotifications = (autoFetch: boolean = true) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar notificações
   */
  const fetchNotifications = useCallback(
    async (filters?: NotificationFilters) => {
      try {
        setLoading(true);
        setError(null);
        const response = await notificationsService.getNotifications(filters);
        setNotifications(response.notifications);
        setUnreadCount(response.unread_count);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Erro ao carregar notificações");
        console.error("Erro ao buscar notificações:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Buscar apenas contador de não lidas
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Erro ao buscar contador de não lidas:", err);
    }
  }, []);

  /**
   * Marcar notificação como lida
   */
  const markAsRead = useCallback(
    async (id: number) => {
      try {
        const updated = await notificationsService.markAsRead(id);

        // Atualizar no estado local
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );

        // Atualizar contador
        if (!updated.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        return updated;
      } catch (err: any) {
        setError(
          err.response?.data?.detail || "Erro ao marcar notificação como lida"
        );
        console.error("Erro ao marcar como lida:", err);
        throw err;
      }
    },
    []
  );

  /**
   * Marcar múltiplas notificações como lidas
   */
  const markMultipleAsRead = useCallback(async (ids: number[]) => {
    try {
      const response = await notificationsService.markMultipleAsRead(ids);

      // Atualizar no estado local
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
      );

      // Atualizar contador
      setUnreadCount((prev) => Math.max(0, prev - response.marked_count));

      return response;
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Erro ao marcar notificações como lidas"
      );
      console.error("Erro ao marcar múltiplas como lidas:", err);
      throw err;
    }
  }, []);

  /**
   * Marcar todas as notificações como lidas
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationsService.markAllAsRead();

      // Atualizar no estado local
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );

      // Zerar contador
      setUnreadCount(0);

      return response;
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Erro ao marcar todas como lidas"
      );
      console.error("Erro ao marcar todas como lidas:", err);
      throw err;
    }
  }, []);

  /**
   * Deletar notificação
   */
  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationsService.deleteNotification(id);

      // Remover do estado local
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id);
        if (notification && !notification.is_read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erro ao deletar notificação");
      console.error("Erro ao deletar notificação:", err);
      throw err;
    }
  }, []);

  /**
   * Deletar todas as notificações lidas
   */
  const deleteAllRead = useCallback(async () => {
    try {
      const response = await notificationsService.deleteAllRead();

      // Remover do estado local
      setNotifications((prev) => prev.filter((n) => !n.is_read));

      return response;
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Erro ao deletar notificações lidas"
      );
      console.error("Erro ao deletar todas lidas:", err);
      throw err;
    }
  }, []);

  /**
   * Atualizar notificações periodicamente
   */
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();

      // Poll a cada 30 segundos
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoFetch, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    setError,
  };
};
