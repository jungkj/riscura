import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  channelId?: string;
  payload?: any;
}

interface WebSocketHook {
  connected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendChatMessage: (channelId: string, content: string, attachments?: any[]) => void;
  sendTyping: (channelId: string, isTyping: boolean) => void;
  markAsRead: (channelId: string, messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  updatePresence: (status: string) => void;
}

export function useWebSocket(onMessage?: (message: any) => void): WebSocketHook {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!session?.user?.id || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat?token=${session.accessToken}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // console.log('WebSocket connected')
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle internal messages
          switch (message.type) {
            case 'connected':
              // console.log('WebSocket authenticated', message.payload)
              break;

            case 'error':
              toast({
                title: 'Connection Error',
                description: message.payload.message,
                variant: 'destructive',
              });
              break;

            case 'heartbeat':
              // Respond to heartbeat
              ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
              break;

            default:
              // Pass other messages to the handler
              if (onMessage) {
                onMessage(message);
              }
          }
        } catch (error) {
          // console.error('Failed to parse WebSocket message:', error)
        }
      };

      ws.onerror = (error) => {
        // console.error('WebSocket error:', error)
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to chat server',
          variant: 'destructive',
        });
      };

      ws.onclose = (event) => {
        // console.log('WebSocket disconnected', event.code, event.reason)
        setConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            // console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current})...`)
            connect();
          }, delay);
        }
      };
    } catch (error) {
      // console.error('Failed to create WebSocket connection:', error)
    }
  }, [session, onMessage, toast]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // console.error('WebSocket is not connected')
    }
  }, []);

  const joinChannel = useCallback(
    (channelId: string) => {
      sendMessage({ type: 'join', channelId });
    },
    [sendMessage]
  );

  const leaveChannel = useCallback(
    (channelId: string) => {
      sendMessage({ type: 'leave', channelId });
    },
    [sendMessage]
  );

  const sendChatMessage = useCallback(
    (channelId: string, content: string, attachments?: any[]) => {
      sendMessage({
        type: 'message',
        channelId,
        payload: { content, attachments },
      });
    },
    [sendMessage]
  );

  const sendTyping = useCallback(
    (channelId: string, isTyping: boolean) => {
      sendMessage({
        type: 'typing',
        channelId,
        payload: { isTyping },
      });
    },
    [sendMessage]
  );

  const markAsRead = useCallback(
    (channelId: string, messageId: string) => {
      sendMessage({
        type: 'read',
        channelId,
        payload: { messageId },
      });
    },
    [sendMessage]
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      sendMessage({
        type: 'reaction',
        payload: { messageId, emoji },
      });
    },
    [sendMessage]
  );

  const updatePresence = useCallback(
    (status: string) => {
      sendMessage({
        type: 'presence',
        payload: { status },
      });
    },
    [sendMessage]
  );

  return {
    connected,
    sendMessage,
    joinChannel,
    leaveChannel,
    sendChatMessage,
    sendTyping,
    markAsRead,
    addReaction,
    updatePresence,
  };
}
