import { useEffect, useState, useCallback, useRef } from 'react';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { startSignalRConnection, stopSignalRConnection, getSignalRConnection } from '@/lib/signalr/signalr';
import { ChatMessage } from '@/types/chat/chat.models';

export const useSignalR = (chatId: string | null) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatIdRef = useRef<string | null>(chatId);

  // Keep chatId ref updated
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  // Initialize SignalR connection
  useEffect(() => {
    let isMounted = true;
    let currentConnection: HubConnection | null = null;

    // Handlers kept in effect scope so we can .off(event, handler) in cleanup
    let handleMessageReceived:
      | ((message: any) => void)
      | null = null;
    let handleReconnecting: (() => void) | null = null;
    let handleReconnected: (() => void) | null = null;
    let handleClose: ((error?: Error) => void) | null = null;

    const initConnection = async () => {
      try {
        const conn = await startSignalRConnection();
        currentConnection = conn;
        
        if (isMounted) {
          setConnection(conn);
          setIsConnected(conn.state === HubConnectionState.Connected);
          console.log('🔗 SignalR connection state:', conn.state);

          // Helper to ensure content is always a string
          const ensureStringContent = (content: any): string => {
            if (typeof content === 'string') return content;
            if (content === null || content === undefined) return '';
            if (typeof content === 'object') {
              if (content.text) return String(content.text);
              if (content.message) return String(content.message);
              return JSON.stringify(content);
            }
            return String(content);
          };

          // Log all SignalR events for debugging
          console.log('🔍 Setting up SignalR event listeners...');
          
          // --- Handlers registered via .on(...) so we can .off(...) in cleanup ---
          handleMessageReceived = (message: any) => {
            const currentChatId = chatIdRef.current;
            console.log('📨 Received message via SignalR:', {
              message,
              messageChatId: message.chatId || message.chat?.id,
              currentChatId,
              messageContent: message.content,
              messageId: message.id
            });
            
            // Accept message if:
            // 1. No chatId filter (show all messages), OR
            // 2. Message matches current chatId
            const messageChatId = message.chatId || message.chat?.id;
            const shouldAccept = !currentChatId || messageChatId === currentChatId;
            
            if (isMounted && shouldAccept) {
              // Transform message to match our format
              const transformedMessage: ChatMessage = {
                id: String(message.id || `msg-${Date.now()}`),
                content: ensureStringContent(message.content),
                senderId: String(message.senderId || message.sender?.id || ''),
                chatId: String(messageChatId || currentChatId || ''),
                sentAt: message.sentAt || message.createdAt || message.timestamp,
                timestamp: message.sentAt || message.createdAt || message.timestamp,
                status: message.status,
                sender: message.sender,
                chat: message.chat,
              };
              
              console.log('✅ Adding message to state:', transformedMessage);
              setMessages((prev) => {
                // 1) If we already have this final message id, ignore
                if (prev.some((m) => m.id === transformedMessage.id)) {
                  console.log('⚠️ Duplicate message ignored (same id):', transformedMessage.id);
                  return prev;
                }

                // 2) Remove any optimistic temp messages for same chat/sender/content
                const filtered = prev.filter((m) => {
                  const isTemp = typeof m.id === 'string' && m.id.startsWith('temp-');
                  const sameChat = m.chatId === transformedMessage.chatId;
                  const sameSender = m.senderId === transformedMessage.senderId;
                  const sameContent =
                    ensureStringContent(m.content) === ensureStringContent(transformedMessage.content);

                  if (isTemp && sameChat && sameSender && sameContent) {
                    console.log('🧹 Removing matching temp message:', m);
                    return false;
                  }

                  return true;
                });

                console.log(`📝 Message added. Total messages: ${filtered.length + 1}`);
                return [...filtered, transformedMessage];
              });
            } else {
              console.log('⚠️ Message filtered out:', {
                reason: !isMounted ? 'Component unmounted' : 'Wrong chatId',
                messageChatId,
                currentChatId
              });
            }
          };

          handleReconnecting = () => {
            console.log('🔄 SignalR reconnecting...');
            if (isMounted) setIsConnected(false);
          };

          handleReconnected = () => {
            console.log('✅ SignalR reconnected');
            if (isMounted) setIsConnected(true);
          };

          handleClose = (error?: Error) => {
            if (error) {
              console.log('🔴 SignalR connection closed with error:', error);
            } else {
              console.log('❌ SignalR connection closed');
            }
            if (isMounted) {
              setIsConnected(false);
              setConnection(null);
            }
          };

          // Register handlers with .on(...)
          conn.on('MessageReceived', handleMessageReceived);
          conn.on('reconnecting', handleReconnecting);
          conn.on('reconnected', handleReconnected);
          conn.on('close', handleClose);
          
          console.log('👂 SignalR message handler registered. Listening for "MessageReceived" events.');
          console.log('🔍 Monitoring all SignalR events. If you see messages from backend, they will appear above.');
        }
      } catch (err) {
        console.error('Failed to initialize SignalR:', err);
        console.warn('SignalR connection failed. Real-time messaging will not work, but you can still send/receive messages via API.');
        if (isMounted) {
          setIsConnected(false);
        }
        // Don't throw - allow app to continue without SignalR
      }
    };

    initConnection();

    return () => {
      isMounted = false;
      if (currentConnection) {
        // Remove handlers before stopping
        if (handleMessageReceived) {
          currentConnection.off('MessageReceived', handleMessageReceived);
        }
        if (handleReconnecting) {
          currentConnection.off('reconnecting', handleReconnecting);
        }
        if (handleReconnected) {
          currentConnection.off('reconnected', handleReconnected);
        }
        if (handleClose) {
          currentConnection.off('close', handleClose);
        }

        stopSignalRConnection();
      }
    };
  }, []); // Only run once on mount

  // Join chat room when chatId changes
  useEffect(() => {
    if (!connection || !chatId) return;
    
    // Wait a bit for connection to be fully ready
    const joinChat = async () => {
      // Check connection state directly
      if (connection.state !== HubConnectionState.Connected) {
        console.log(`⏳ Waiting for connection... Current state: ${connection.state}`);
        return;
      }

      try {
        console.log(`🔌 Joining chat room: ${chatId}`);
        await connection.invoke('JoinChat', chatId);
        console.log(`✅ Successfully joined chat: ${chatId}`);
        console.log(`📡 Now listening for real-time messages in chat: ${chatId}`);
      } catch (err) {
        console.error('❌ Error joining chat:', err);
      }
    };

    // Small delay to ensure connection is ready
    const timeoutId = setTimeout(joinChat, 100);

    return () => {
      clearTimeout(timeoutId);
      if (connection && chatId && connection.state === HubConnectionState.Connected) {
        console.log(`🔌 Leaving chat room: ${chatId}`);
        connection.invoke('LeaveChat', chatId).catch((err) => {
          console.error('❌ Error leaving chat:', err);
        });
      }
    };
  }, [connection, chatId, isConnected]);

  // Send a message via SignalR Hub (ChatHub.SendMessage)
  // Backend signature: Task<Message> SendMessage(string chatId, Message message)
  const sendMessage = useCallback(
    async (content: string, senderId?: string) => {
      if (!connection || !chatId || !isConnected) {
        throw new Error('Not connected to chat');
      }

      try {
        // Match backend Message model (PascalCase properties)
        const payload: { Content: string; SenderId?: string } = { Content: content };
        if (senderId) {
          payload.SenderId = senderId;
        }

        console.log('📡 Sending message via SignalR hub SendMessage:', {
          chatId,
          payload,
        });

        // Invoke hub method; it will save + broadcast
        const result: any = await connection.invoke('SendMessage', chatId, payload);
        console.log('✅ Hub SendMessage result:', result);
        return result;
      } catch (err) {
        console.error('Error sending message via SignalR:', err);
        throw err;
      }
    },
    [connection, chatId, isConnected]
  );

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  return {
    connection,
    isConnected,
    messages,
    setMessages,
    sendMessage,
    addMessage,
  };
};
