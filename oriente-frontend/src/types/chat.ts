// Tipos alinhados com os schemas do backend

export type ChatType = "individual" | "group";

// Participante do chat
export interface ChatParticipant {
  id: number;
  name: string;
  email: string;
  joined_at?: string;
  last_read_at?: string;
}

// Remetente da mensagem
export interface ChatMessageSender {
  id: number;
  name: string;
  email: string;
}

// Anexo de mensagem de chat
export interface ChatMessageAttachment {
  id: number;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  message_id: number;
  uploaded_by_id: number | null;
  created_at: string;
  uploaded_by?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ChatMessageAttachmentListResponse {
  attachments: ChatMessageAttachment[];
  total: number;
}

// Mensagem de chat
export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_id?: number;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  edited_at?: string;
  sender?: ChatMessageSender;
  can_edit: boolean;
  can_delete: boolean;
  attachments?: ChatMessageAttachment[];
}

// Preview da última mensagem
export interface ChatLastMessage {
  id: number;
  content: string;
  sender_name?: string;
  created_at: string;
}

// Chat (conversa)
export interface Chat {
  id: number;
  type: ChatType;
  name?: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  participant_count: number;
  participants: ChatParticipant[];
  last_message?: ChatLastMessage;
  unread_count: number;
}

// Resposta paginada de mensagens
export interface ChatMessageListResponse {
  total: number;
  messages: ChatMessage[];
  has_more: boolean;
}

// === REQUEST TYPES ===

// Criar chat
export interface CreateChatRequest {
  type: ChatType;
  name?: string;
  participant_ids: number[];
}

// Atualizar chat (nome do grupo)
export interface UpdateChatRequest {
  name: string;
}

// Criar mensagem
export interface CreateChatMessageRequest {
  content: string;
}

// Atualizar mensagem
export interface UpdateChatMessageRequest {
  content: string;
}

// Adicionar participante
export interface AddParticipantRequest {
  user_id: number;
}

// Marcar como lido
export interface UpdateLastReadRequest {
  last_message_id?: number;
}

// === WEBSOCKET TYPES ===

export type WebSocketEventType = "message" | "typing" | "read" | "error" | "connected";

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
}

// Evento de typing
export interface TypingEvent {
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

// Evento de read
export interface ReadEvent {
  user_id: number;
  message_id: number;
}
