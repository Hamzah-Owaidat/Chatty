import * as signalR from '@microsoft/signalr';
import { getSavedToken } from '@/utils/authToken';

let connection: signalR.HubConnection | null = null;
let connectionPromise: Promise<signalR.HubConnection> | null = null;

export const getSignalRConnection = (): signalR.HubConnection | null => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }
  return null;
};

export const startSignalRConnection = async (): Promise<signalR.HubConnection> => {
  const token = getSavedToken();
  if (!token) {
    throw new Error('No auth token found');
  }

  // If already connected, return existing connection
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // Close existing connection if any (but not connected)
  if (connection) {
    await stopSignalRConnection();
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  
  // Construct the SignalR hub URL
  // The hub is at /hubs/chat (the /negotiate endpoint is added automatically by SignalR)
  // You can set NEXT_PUBLIC_SIGNALR_HUB_URL in .env to override
  
  let hubUrl: string;
  if (process.env.NEXT_PUBLIC_SIGNALR_HUB_URL) {
    // Use explicit hub URL from env
    hubUrl = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL;
  } else {
    // Remove /api from base URL and add /hubs/chat
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, ''); // Remove trailing /api
    hubUrl = `${baseUrl}/hubs/chat`;
  }
  
  console.log('Attempting to connect to SignalR hub at:', hubUrl);

  // Create connection promise to prevent multiple simultaneous connections
  connectionPromise = (async () => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          // Return the token - SignalR will send it as query parameter (access_token)
          // This is the standard way SignalR handles authentication
          return token;
        },
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, then 30s intervals
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        }
      })
      .build();

    try {
      await newConnection.start();
      console.log('✅ SignalR Connected successfully to:', hubUrl);
      connection = newConnection;
      connectionPromise = null; // Clear promise on success
      return connection;
    } catch (err: any) {
      console.error('❌ SignalR Connection Error:', err);
      console.error('Hub URL attempted:', hubUrl);
      console.error('Make sure:');
      console.error('1. The SignalR hub is configured in your .NET backend');
      console.error('2. The hub URL path is correct (common: /api/chathub, /chathub, /hub/chat)');
      console.error('3. CORS is properly configured for SignalR');
      console.error('4. Set NEXT_PUBLIC_SIGNALR_HUB_URL in .env if using a different path');
      connection = null;
      connectionPromise = null; // Clear promise on error
      throw err;
    }
  })();

  return connectionPromise;
};

export const stopSignalRConnection = async (): Promise<void> => {
  // Clear any pending connection promise
  connectionPromise = null;
  
  if (connection) {
    try {
      await connection.stop();
      console.log('SignalR Disconnected');
    } catch (err) {
      console.error('Error stopping SignalR connection:', err);
    } finally {
      connection = null;
    }
  }
};

export const sendMessageViaSignalR = async (chatId: string, content: string): Promise<void> => {
  const conn = getSignalRConnection();
  if (!conn) {
    throw new Error('SignalR connection not established');
  }
  
  try {
    await conn.invoke('SendMessage', chatId, content);
  } catch (err) {
    console.error('Error sending message via SignalR:', err);
    throw err;
  }
};
