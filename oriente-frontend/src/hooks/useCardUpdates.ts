import { useEffect, useRef, useCallback } from 'react';

interface CardUpdateEvent {
  type: 'card_moved' | 'card_updated' | 'card_created' | 'card_deleted' | 'connected' | 'error';
  data: Record<string, any>;
}

interface UseCardUpdatesOptions {
  projectId?: number;
  onCardMoved?: (data: any) => void;
  onCardUpdated?: (data: any) => void;
  onCardCreated?: (data: any) => void;
  onCardDeleted?: (data: any) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

/**
 * Hook para escutar atualizações de cards em tempo real via WebSocket
 *
 * Exemplo de uso:
 * ```
 * const { isConnected } = useCardUpdates({
 *   projectId: 1,
 *   onCardMoved: (data) => console.log('Card movido:', data),
 *   onCardUpdated: (data) => console.log('Card atualizado:', data),
 *   enabled: true
 * });
 * ```
 */
export const useCardUpdates = (options: UseCardUpdatesOptions = {}) => {
  const {
    projectId,
    onCardMoved,
    onCardUpdated,
    onCardCreated,
    onCardDeleted,
    onError,
    enabled = true
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectingRef = useRef(false);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 segundos
  const HEARTBEAT_INTERVAL = 30000; // 30 segundos

  const connect = useCallback(() => {
    if (!enabled || !projectId || isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('Token de autenticação não encontrado');
        isConnectingRef.current = false;
        return;
      }

      // Construir URL do WebSocket com base no protocolo atual
      let wsBaseUrl = import.meta.env.VITE_WS_URL;

      if (!wsBaseUrl) {
        // Se não configurado, usar o protocolo apropriado com base na URL atual
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsBaseUrl = `${protocol}//${host}`;
      }

      const wsUrl = `${wsBaseUrl}/ws/projects/${projectId}?token=${encodeURIComponent(token)}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`WebSocket conectado ao projeto ${projectId}`);
        reconnectAttemptRef.current = 0;
        isConnectingRef.current = false;

        // Iniciar heartbeat
        setupHeartbeat();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: CardUpdateEvent = JSON.parse(event.data);

          switch (message.type) {
            case 'connected':
              console.log('Conectado ao WebSocket de cards:', message.data);
              break;

            case 'card_moved':
              onCardMoved?.(message.data);
              break;

            case 'card_updated':
              onCardUpdated?.(message.data);
              break;

            case 'card_created':
              onCardCreated?.(message.data);
              break;

            case 'card_deleted':
              onCardDeleted?.(message.data);
              break;

            case 'error':
              console.error('Erro do WebSocket:', message.data.message);
              onError?.(message.data.message);
              break;

            default:
              console.warn('Evento desconhecido:', message.type);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        onError?.('Erro de conexão WebSocket');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket desconectado');
        isConnectingRef.current = false;
        clearHeartbeat();

        // Tentar reconectar se ainda temos tentativas
        if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS && enabled) {
          reconnectAttemptRef.current++;
          console.log(
            `Tentando reconectar (${reconnectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS}) em ${RECONNECT_DELAY}ms...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      };
    } catch (error) {
      console.error('Erro ao conectar ao WebSocket:', error);
      isConnectingRef.current = false;
      onError?.('Falha ao conectar ao WebSocket');
    }
  }, [projectId, enabled, onCardMoved, onCardUpdated, onCardCreated, onCardDeleted, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    clearHeartbeat();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const setupHeartbeat = useCallback(() => {
    heartbeatTimeoutRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Erro ao enviar heartbeat:', error);
        }
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled && projectId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, projectId, connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    websocket: wsRef.current,
    reconnectAttempt: reconnectAttemptRef.current,
    connect,
    disconnect
  };
};
