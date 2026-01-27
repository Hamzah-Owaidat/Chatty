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
          
          // Listen for ANY method call from SignalR (for debugging)
          const originalInvoke = conn.invoke.bind(conn);
          conn.invoke = function(method: string, ...args: any[]) {
            console.log('📡 SignalR Invoke:', method, args);
            return originalInvoke(method, ...args);
          };
          
          // Set up message handler - use ref to get current chatId
          conn.on('ReceiveMessage', (message: any) => {
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
                // Avoid duplicates
                if (prev.some((m) => m.id === transformedMessage.id)) {
                  console.log('⚠️ Duplicate message ignored:', transformedMessage.id);
                  return prev;
                }
                console.log(`📝 Message added. Total messages: ${prev.length + 1}`);
                return [...prev, transformedMessage];
              });
            } else {
              console.log('⚠️ Message filtered out:', {
                reason: !isMounted ? 'Component unmounted' : 'Wrong chatId',
                messageChatId,
                currentChatId
              });
            }
          });
          
          console.log('👂 SignalR message handler registered. Listening for "ReceiveMessage" events.');
          
          // Add a test listener to catch ANY SignalR messages (for debugging)
          conn.onclose((error) => {
            if (error) {
              console.log('🔴 SignalR connection closed with error:', error);
            }
          });
          
          // Log when ANY method is called on the connection
          console.log('🔍 Monitoring all SignalR events. If you see messages from backend, they will appear above.');

          // Handle connection state changes
          conn.onreconnecting(() => {
            console.log('🔄 SignalR reconnecting...');
            if (isMounted) setIsConnected(false);
          });

          conn.onreconnected(() => {
            console.log('✅ SignalR reconnected');
            if (isMounted) setIsConnected(true);
          });

          conn.onclose(() => {
            console.log('❌ SignalR connection closed');
            if (isMounted) {
              setIsConnected(false);
              setConnection(null);
            }
          });
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
        currentConnection.off('ReceiveMessage');
        currentConnection.off('reconnecting');
        currentConnection.off('reconnected');
        currentConnection.off('close');
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

  const sendMessage = useCallback(async (content: string) => {
    if (!connection || !chatId || !isConnected) {
      throw new Error('Not connected to chat');
    }

    try {
      await connection.invoke('SendMessage', chatId, content);
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [connection, chatId, isConnected]);

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
