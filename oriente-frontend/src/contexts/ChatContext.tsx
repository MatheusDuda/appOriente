import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import chatService from "../services/chatService";
import { useWebSocketChat } from "../hooks/useWebSocketChat";
import type {
  Chat,
  ChatMessage,
  CreateChatRequest,
  CreateChatMessageRequest,
  TypingEvent,
  ReadEvent,
} from "../types/chat";

interface ChatContextType {
  // Estado
  chats: Chat[];
  selectedChat: Chat | null;
  messages: ChatMessage[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isConnected: boolean;
  typingUsers: Map<number, string>; // userId -> userName
  error: string | null;

  // Ações - Chats
  loadChats: () => Promise<void>;
  selectChat: (chatId: number) => Promise<void>;
  createChat: (data: CreateChatRequest) => Promise<void>;
  updateGroupName: (chatId: number, name: string) => Promise<void>;
  addParticipant: (chatId: number, userId: number) => Promise<void>;
  removeParticipant: (chatId: number, userId: number) => Promise<void>;

  // Ações - Mensagens
  loadMessages: (chatId: number, offset?: number) => Promise<void>;
  sendMessage: (content: string) => Promise<ChatMessage>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  markAsRead: (chatId: number) => Promise<void>;

  // Ações - WebSocket
  sendTyping: (isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Handlers do WebSocket
  const handleWebSocketMessage = useCallback((message: ChatMessage) => {
    console.log("[ChatContext] Nova mensagem via WebSocket:", message);
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleWebSocketTyping = useCallback((event: TypingEvent) => {
    console.log("[ChatContext] Evento de typing:", event);
    setTypingUsers((prev) => {
      const newMap = new Map(prev);
      if (event.is_typing) {
        newMap.set(event.user_id, event.user_name);
      } else {
        newMap.delete(event.user_id);
      }
      return newMap;
    });
  }, []);

  const handleWebSocketRead = useCallback((event: ReadEvent) => {
    console.log("[ChatContext] Evento de leitura:", event);
    // Aqui poderia atualizar a UI para mostrar que a mensagem foi lida
  }, []);

  const handleWebSocketError = useCallback((error: string) => {
    console.error("[ChatContext] Erro do WebSocket:", error);
    setError(error);
  }, []);

  // Refs para funções - previne problemas de ordem de declaração
  const loadMessagesRef = useRef<((chatId: number, offset?: number) => Promise<void>) | null>(null);
  const markAsReadRef = useRef<((chatId: number) => Promise<void>) | null>(null);

  // WebSocket Hook
  const { isConnected, sendTyping } = useWebSocketChat({
    chatId: selectedChat?.id || null,
    onMessage: handleWebSocketMessage,
    onTyping: handleWebSocketTyping,
    onRead: handleWebSocketRead,
    onError: handleWebSocketError,
  });

  /**
   * Carrega lista de chats do usuário
   */
  const loadChats = useCallback(async () => {
    try {
      setIsLoadingChats(true);
      setError(null);
      console.log("[ChatContext] Carregando chats...");
      const data = await chatService.getChats();
      setChats(data);
      console.log(`[ChatContext] ✓ ${data.length} chats carregados`);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao carregar chats:", err);
      setError(err.response?.data?.message || "Erro ao carregar chats");
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  /**
   * Seleciona um chat e carrega suas mensagens
   */
  const selectChat = useCallback(async (chatId: number) => {
    try {
      setError(null);
      console.log(`[ChatContext] Selecionando chat ${chatId}...`);

      // Busca detalhes do chat
      const chat = await chatService.getChatById(chatId);
      setSelectedChat(chat);

      // Carrega mensagens usando ref
      if (loadMessagesRef.current) {
        await loadMessagesRef.current(chatId);
      }

      // Marca como lido usando ref
      if (markAsReadRef.current) {
        await markAsReadRef.current(chatId);
      }

      console.log(`[ChatContext] ✓ Chat ${chatId} selecionado`);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao selecionar chat:", err);
      setError(err.response?.data?.message || "Erro ao selecionar chat");
    }
  }, []); // Array vazio - usa refs para evitar dependências circulares

  /**
   * Carrega mensagens de um chat
   */
  const loadMessages = useCallback(async (chatId: number, offset: number = 0) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      console.log(`[ChatContext] Carregando mensagens do chat ${chatId}...`);

      const data = await chatService.getChatMessages(chatId, 50, offset);

      if (offset === 0) {
        // Reverte array: backend retorna DESC, frontend exibe ASC (WhatsApp style)
        setMessages([...data.messages].reverse());
      } else {
        // Para paginação: reverte e prepend mensagens mais antigas
        setMessages((prev) => [...[...data.messages].reverse(), ...prev]);
      }

      console.log(`[ChatContext] ✓ ${data.messages.length} mensagens carregadas`);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao carregar mensagens:", err);
      setError(err.response?.data?.message || "Erro ao carregar mensagens");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Atualiza ref quando loadMessages muda
  useEffect(() => {
    loadMessagesRef.current = loadMessages;
  }, [loadMessages]);

  /**
   * Cria um novo chat
   */
  const createChat = useCallback(async (data: CreateChatRequest) => {
    try {
      setError(null);
      console.log("[ChatContext] Criando novo chat...");
      const newChat = await chatService.createChat(data);

      // Validação: verifica se o chat foi criado corretamente
      if (!newChat || !newChat.id) {
        throw new Error("Resposta inválida do servidor ao criar chat");
      }

      setChats((prev) => [newChat, ...prev]);
      console.log(`[ChatContext] ✓ Chat ${newChat.id} criado`);

      // Seleciona o chat criado
      await selectChat(newChat.id);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao criar chat:", err);
      const errorMessage = err.response?.data?.message || err.message || "Erro ao criar chat";
      setError(errorMessage);
      throw err;
    }
  }, [selectChat]);

  /**
   * Envia uma mensagem
   */
  const sendMessage = useCallback(async (content: string): Promise<ChatMessage> => {
    if (!selectedChat) {
      console.warn("[ChatContext] Nenhum chat selecionado");
      throw new Error("Nenhum chat selecionado");
    }

    try {
      setError(null);
      const data: CreateChatMessageRequest = { content };

      // Usa REST API sempre para garantir que a mensagem seja adicionada
      console.log("[ChatContext] Enviando mensagem via REST API...");
      const message = await chatService.sendMessage(selectedChat.id, data);

      // Adiciona a mensagem ao estado local imediatamente
      setMessages((prev) => [...prev, message]);

      // Atualiza a lista de chats (move o chat para o topo)
      await loadChats();

      return message;
    } catch (err: any) {
      console.error("[ChatContext] Erro ao enviar mensagem:", err);
      setError(err.response?.data?.message || "Erro ao enviar mensagem");
      throw err;
    }
  }, [selectedChat, loadChats]);

  /**
   * Edita uma mensagem
   */
  const editMessage = useCallback(async (messageId: number, content: string) => {
    if (!selectedChat) return;

    try {
      setError(null);
      console.log(`[ChatContext] Editando mensagem ${messageId}...`);
      const updatedMessage = await chatService.editMessage(selectedChat.id, messageId, { content });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updatedMessage : msg))
      );

      console.log(`[ChatContext] ✓ Mensagem ${messageId} editada`);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao editar mensagem:", err);
      setError(err.response?.data?.message || "Erro ao editar mensagem");
      throw err;
    }
  }, [selectedChat]);

  /**
   * Deleta uma mensagem
   */
  const deleteMessage = useCallback(async (messageId: number) => {
    if (!selectedChat) return;

    try {
      setError(null);
      console.log(`[ChatContext] Deletando mensagem ${messageId}...`);
      await chatService.deleteMessage(selectedChat.id, messageId);

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      console.log(`[ChatContext] ✓ Mensagem ${messageId} deletada`);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao deletar mensagem:", err);
      setError(err.response?.data?.message || "Erro ao deletar mensagem");
      throw err;
    }
  }, [selectedChat]);

  /**
   * Marca um chat como lido
   */
  const markAsRead = useCallback(async (chatId: number) => {
    try {
      await chatService.markAsRead(chatId);

      // Atualiza o contador de não lidas localmente
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, unread_count: 0 } : chat
        )
      );
    } catch (err: any) {
      console.error("[ChatContext] Erro ao marcar como lido:", err);
    }
  }, []);

  // Atualiza ref quando markAsRead muda
  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  /**
   * Atualiza nome do grupo
   */
  const updateGroupName = useCallback(async (chatId: number, name: string) => {
    try {
      setError(null);
      console.log(`[ChatContext] Atualizando nome do grupo ${chatId}...`);
      const updatedChat = await chatService.updateGroupName(chatId, { name });

      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? updatedChat : chat))
      );

      if (selectedChat?.id === chatId) {
        setSelectedChat(updatedChat);
      }

      console.log(`[ChatContext] ✓ Nome do grupo atualizado`);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao atualizar nome do grupo:", err);
      setError(err.response?.data?.message || "Erro ao atualizar nome do grupo");
      throw err;
    }
  }, [selectedChat]);

  /**
   * Adiciona participante ao grupo
   */
  const addParticipant = useCallback(async (chatId: number, userId: number) => {
    try {
      setError(null);
      console.log(`[ChatContext] Adicionando participante ${userId} ao grupo ${chatId}...`);
      const updatedChat = await chatService.addParticipant(chatId, { user_id: userId });

      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? updatedChat : chat))
      );

      if (selectedChat?.id === chatId) {
        setSelectedChat(updatedChat);
      }

      console.log(`[ChatContext] ✓ Participante adicionado`);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao adicionar participante:", err);
      setError(err.response?.data?.message || "Erro ao adicionar participante");
      throw err;
    }
  }, [selectedChat]);

  /**
   * Remove participante do grupo
   */
  const removeParticipant = useCallback(async (chatId: number, userId: number) => {
    try {
      setError(null);
      console.log(`[ChatContext] Removendo participante ${userId} do grupo ${chatId}...`);
      const updatedChat = await chatService.removeParticipant(chatId, userId);

      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? updatedChat : chat))
      );

      if (selectedChat?.id === chatId) {
        setSelectedChat(updatedChat);
      }

      console.log(`[ChatContext] ✓ Participante removido`);
    } catch (err: any) {
      console.error("[ChatContext] Erro ao remover participante:", err);
      setError(err.response?.data?.message || "Erro ao remover participante");
      throw err;
    }
  }, [selectedChat]);

  // Carrega chats ao montar o componente
  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez no mount inicial

  const value = useMemo(
    () => ({
      chats,
      selectedChat,
      messages,
      isLoadingChats,
      isLoadingMessages,
      isConnected,
      typingUsers,
      error,
      loadChats,
      selectChat,
      createChat,
      updateGroupName,
      addParticipant,
      removeParticipant,
      loadMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      markAsRead,
      sendTyping,
    }),
    [
      chats,
      selectedChat,
      messages,
      isLoadingChats,
      isLoadingMessages,
      isConnected,
      typingUsers,
      error,
      loadChats,
      selectChat,
      createChat,
      updateGroupName,
      addParticipant,
      removeParticipant,
      loadMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      markAsRead,
      sendTyping,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
