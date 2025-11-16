import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage, WebSocketMessage, TypingEvent, ReadEvent } from "../types/chat";

interface UseWebSocketChatProps {
  chatId: number | null;
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (event: TypingEvent) => void;
  onRead?: (event: ReadEvent) => void;
  onError?: (error: string) => void;
}

interface UseWebSocketChatReturn {
  isConnected: boolean;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
  sendRead: (messageId: number) => void;
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
const RECONNECT_DELAY = 3000; // 3 segundos
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Hook para gerenciar conexão WebSocket de chat
 * @param props - Configurações do WebSocket
 * @returns Funções e estado da conexão
 */
export function useWebSocketChat({
  chatId,
  onMessage,
  onTyping,
  onRead,
  onError,
}: UseWebSocketChatProps): UseWebSocketChatReturn {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs para callbacks - previne loop de reconexão
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onReadRef = useRef(onRead);
  const onErrorRef = useRef(onError);

  // Atualiza refs quando callbacks mudam
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onTypingRef.current = onTyping;
  }, [onTyping]);

  useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Envia uma mensagem pelo WebSocket
   */
  const send = useCallback((data: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("[WebSocket] Tentou enviar mensagem mas conexão não está aberta");
    }
  }, []);

  /**
   * Envia uma mensagem de chat
   */
  const sendMessage = useCallback(
    (content: string) => {
      send({
        type: "message",
        data: { content },
      });
    },
    [send]
  );

  /**
   * Envia indicador de digitação
   */
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      send({
        type: "typing",
        data: { is_typing: isTyping },
      });
    },
    [send]
  );

  /**
   * Envia confirmação de leitura
   */
  const sendRead = useCallback(
    (messageId: number) => {
      send({
        type: "read",
        data: { message_id: messageId },
      });
    },
    [send]
  );

  /**
   * Conecta ao WebSocket
   */
  const connect = useCallback(() => {
    if (!chatId) {
      console.log("[WebSocket] chatId não definido, pulando conexão");
      return;
    }

    // Pega o token do localStorage
    const token = localStorage.getItem("auth_token");
    if (!token) {
      console.error("[WebSocket] Token não encontrado no localStorage");
      onErrorRef.current?.("Token de autenticação não encontrado");
      return;
    }

    // Fecha conexão existente se houver
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log(`[WebSocket] Conectando ao chat ${chatId}...`);
    const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${chatId}?token=${token}`);

    ws.onopen = () => {
      console.log(`[WebSocket] ✓ Conectado ao chat ${chatId}`);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log("[WebSocket] Mensagem recebida:", message.type);

        switch (message.type) {
          case "message":
            onMessageRef.current?.(message.data as ChatMessage);
            break;
          case "typing":
            onTypingRef.current?.(message.data as TypingEvent);
            break;
          case "read":
            onReadRef.current?.(message.data as ReadEvent);
            break;
          case "error":
            console.error("[WebSocket] Erro do servidor:", message.data);
            onErrorRef.current?.(message.data?.message || "Erro desconhecido");
            break;
          case "connected":
            console.log("[WebSocket] Confirmação de conexão recebida");
            break;
          default:
            console.warn("[WebSocket] Tipo de mensagem desconhecido:", message.type);
        }
      } catch (error) {
        console.error("[WebSocket] Erro ao processar mensagem:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Erro na conexão:", error);
      onErrorRef.current?.("Erro na conexão WebSocket");
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Conexão fechada (code: ${event.code})`);
      setIsConnected(false);
      wsRef.current = null;

      // Tenta reconectar se não foi fechamento intencional
      if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        console.log(
          `[WebSocket] Tentando reconectar (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY);
      } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error("[WebSocket] Número máximo de tentativas de reconexão atingido");
        onErrorRef.current?.("Não foi possível reconectar ao chat");
      }
    };

    wsRef.current = ws;
  }, [chatId]); // Agora depende apenas de chatId!

  /**
   * Desconecta do WebSocket
   */
  const disconnect = useCallback(() => {
    console.log("[WebSocket] Desconectando...");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "Disconnect requested");
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Conecta quando chatId muda
  useEffect(() => {
    if (chatId) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // Apenas chatId - connect/disconnect causariam loop de reconexão

  return {
    isConnected,
    sendMessage,
    sendTyping,
    sendRead,
  };
}
