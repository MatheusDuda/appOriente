import api from "./api";
import type {
  Chat,
  ChatMessage,
  ChatMessageListResponse,
  CreateChatRequest,
  UpdateChatRequest,
  CreateChatMessageRequest,
  UpdateChatMessageRequest,
  AddParticipantRequest,
  UpdateLastReadRequest,
} from "../types/chat";

/**
 * Serviço para gerenciar chats e mensagens
 *
 * NOTA: Os endpoints de chat retornam diretamente os modelos,
 * sem o wrapper ApiResponse usado em outros endpoints (como auth).
 */
const chatService = {
  /**
   * Lista todos os chats do usuário
   * @returns Lista de chats ordenados por última atividade
   */
  async getChats(): Promise<Chat[]> {
    const response = await api.get<Chat[]>("/api/chats");
    return response.data;
  },

  /**
   * Busca um chat por ID
   * @param chatId - ID do chat
   * @returns Dados detalhados do chat
   */
  async getChatById(chatId: number): Promise<Chat> {
    const response = await api.get<Chat>(`/api/chats/${chatId}`);
    return response.data;
  },

  /**
   * Cria um novo chat (individual ou grupo)
   * @param data - Dados para criação do chat
   * @returns Chat criado
   */
  async createChat(data: CreateChatRequest): Promise<Chat> {
    const response = await api.post<Chat>("/api/chats", data);
    return response.data;
  },

  /**
   * Atualiza o nome de um grupo
   * @param chatId - ID do chat (grupo)
   * @param data - Novo nome do grupo
   * @returns Chat atualizado
   */
  async updateGroupName(chatId: number, data: UpdateChatRequest): Promise<Chat> {
    const response = await api.put<Chat>(`/api/chats/${chatId}`, data);
    return response.data;
  },

  /**
   * Busca mensagens de um chat com paginação
   * @param chatId - ID do chat
   * @param limit - Mensagens por página (padrão: 50, max: 100)
   * @param offset - Número de mensagens para pular (padrão: 0)
   * @returns Lista paginada de mensagens
   */
  async getChatMessages(
    chatId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessageListResponse> {
    const response = await api.get<ChatMessageListResponse>(
      `/api/chats/${chatId}/messages`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  /**
   * Envia uma mensagem em um chat
   * @param chatId - ID do chat
   * @param data - Conteúdo da mensagem
   * @returns Mensagem criada
   */
  async sendMessage(chatId: number, data: CreateChatMessageRequest): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>(
      `/api/chats/${chatId}/messages`,
      data
    );
    return response.data;
  },

  /**
   * Edita uma mensagem enviada (até 10 minutos após o envio)
   * @param chatId - ID do chat
   * @param messageId - ID da mensagem
   * @param data - Novo conteúdo da mensagem
   * @returns Mensagem atualizada
   */
  async editMessage(
    chatId: number,
    messageId: number,
    data: UpdateChatMessageRequest
  ): Promise<ChatMessage> {
    const response = await api.put<ChatMessage>(
      `/api/chats/${chatId}/messages/${messageId}`,
      data
    );
    return response.data;
  },

  /**
   * Deleta uma mensagem enviada (até 10 minutos após o envio)
   * @param chatId - ID do chat
   * @param messageId - ID da mensagem
   */
  async deleteMessage(chatId: number, messageId: number): Promise<void> {
    await api.delete(`/api/chats/${chatId}/messages/${messageId}`);
  },

  /**
   * Marca um chat como lido
   * @param chatId - ID do chat
   * @param data - ID da última mensagem lida (opcional)
   */
  async markAsRead(chatId: number, data?: UpdateLastReadRequest): Promise<void> {
    await api.put(`/api/chats/${chatId}/read`, data || {});
  },

  /**
   * Adiciona um participante a um grupo
   * @param chatId - ID do chat (grupo)
   * @param data - ID do usuário a ser adicionado
   * @returns Chat atualizado
   */
  async addParticipant(chatId: number, data: AddParticipantRequest): Promise<Chat> {
    const response = await api.post<Chat>(
      `/api/chats/${chatId}/participants`,
      data
    );
    return response.data;
  },

  /**
   * Remove um participante de um grupo
   * @param chatId - ID do chat (grupo)
   * @param userId - ID do usuário a ser removido
   * @returns Chat atualizado
   */
  async removeParticipant(chatId: number, userId: number): Promise<Chat> {
    const response = await api.delete<Chat>(
      `/api/chats/${chatId}/participants/${userId}`
    );
    return response.data;
  },
};

export default chatService;
