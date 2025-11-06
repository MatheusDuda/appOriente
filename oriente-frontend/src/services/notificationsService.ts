import api from "./api";
import type {
  Notification,
  NotificationCreateRequest,
  NotificationListResponse,
  NotificationStats,
  NotificationMarkReadRequest,
  NotificationMarkReadResponse,
  NotificationCountResponse,
  NotificationDeleteResponse,
  NotificationFilters,
} from "../types/notifications";

class NotificationsService {
  /**
   * Criar nova notificação
   * @param data - Dados da notificação
   * @returns Notificação criada
   */
  async createNotification(
    data: NotificationCreateRequest
  ): Promise<Notification> {
    const response = await api.post<Notification>(
      "/api/notifications",
      data
    );
    return response.data;
  }

  /**
   * Listar notificações do usuário atual
   * @param filters - Filtros opcionais
   * @returns Lista de notificações
   */
  async getNotifications(
    filters?: NotificationFilters
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams();

    if (filters?.unread_only !== undefined) {
      params.append("unread_only", filters.unread_only.toString());
    }

    if (filters?.notification_type) {
      params.append("notification_type", filters.notification_type);
    }

    if (filters?.limit) {
      params.append("limit", filters.limit.toString());
    }

    const response = await api.get<NotificationListResponse>(
      `/api/notifications?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Buscar notificação por ID
   * @param id - ID da notificação
   * @returns Notificação
   */
  async getNotificationById(id: number): Promise<Notification> {
    const response = await api.get<Notification>(`/api/notifications/${id}`);
    return response.data;
  }

  /**
   * Obter contagem de notificações não lidas
   * @returns Contagem de não lidas
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<NotificationCountResponse>(
      "/api/notifications/count"
    );
    return response.data.unread_count;
  }

  /**
   * Obter estatísticas de notificações
   * @returns Estatísticas
   */
  async getStats(): Promise<NotificationStats> {
    const response = await api.get<NotificationStats>(
      "/api/notifications/stats"
    );
    return response.data;
  }

  /**
   * Marcar notificação como lida
   * @param id - ID da notificação
   * @returns Notificação atualizada
   */
  async markAsRead(id: number): Promise<Notification> {
    const response = await api.patch<Notification>(
      `/api/notifications/${id}/read`
    );
    return response.data;
  }

  /**
   * Marcar múltiplas notificações como lidas
   * @param ids - IDs das notificações
   * @returns Resposta com quantidade marcada
   */
  async markMultipleAsRead(
    ids: number[]
  ): Promise<NotificationMarkReadResponse> {
    const request: NotificationMarkReadRequest = { notification_ids: ids };
    const response = await api.patch<NotificationMarkReadResponse>(
      "/api/notifications/read",
      request
    );
    return response.data;
  }

  /**
   * Marcar todas as notificações como lidas
   * @returns Resposta com quantidade marcada
   */
  async markAllAsRead(): Promise<{ message: string; marked_count: number }> {
    const response = await api.patch<{
      message: string;
      marked_count: number;
    }>("/api/notifications/read-all");
    return response.data;
  }

  /**
   * Deletar notificação
   * @param id - ID da notificação
   */
  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/api/notifications/${id}`);
  }

  /**
   * Deletar todas as notificações lidas
   * @returns Resposta com quantidade deletada
   */
  async deleteAllRead(): Promise<NotificationDeleteResponse> {
    const response = await api.delete<NotificationDeleteResponse>(
      "/api/notifications/read/all"
    );
    return response.data;
  }
}

export const notificationsService = new NotificationsService();
