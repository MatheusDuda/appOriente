// Tipos de notificação
export type NotificationType = "TASK" | "TEAM" | "SYSTEM";

// Tipos de entidade relacionada
export type RelatedEntityType = "TASK" | "PROJECT" | "TEAM";

// Interface principal de notificação
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  recipient_user_id: number;
  related_entity_type?: RelatedEntityType | null;
  related_entity_id?: number | null;
  action_url?: string | null;
  recipient?: NotificationRecipient;
}

// Interface do destinatário (quando incluído na resposta)
export interface NotificationRecipient {
  id: number;
  name: string;
  email: string;
}

// Interface para criar notificação
export interface NotificationCreateRequest {
  type: NotificationType;
  title: string;
  message: string;
  recipient_user_id?: number;
  related_entity_type?: RelatedEntityType;
  related_entity_id?: number;
  action_url?: string;
}

// Interface de resposta de lista de notificações
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

// Interface de estatísticas
export interface NotificationStats {
  total: number;
  unread_count: number;
  read_count: number;
  by_type: {
    [key: string]: number;
  };
}

// Interface para marcar notificações como lidas
export interface NotificationMarkReadRequest {
  notification_ids: number[];
}

// Interface de resposta ao marcar como lida
export interface NotificationMarkReadResponse {
  message: string;
  marked_count: number;
  notification_ids: number[];
}

// Interface de resposta de contador
export interface NotificationCountResponse {
  unread_count: number;
}

// Interface de resposta de deleção em massa
export interface NotificationDeleteResponse {
  message: string;
  deleted_count: number;
}

// Filtros para busca de notificações
export interface NotificationFilters {
  unread_only?: boolean;
  notification_type?: NotificationType;
  limit?: number;
}
