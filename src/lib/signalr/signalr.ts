import * as signalR from "@microsoft/signalr";
import { getSavedToken } from "@/utils/authToken";

let connection: signalR.HubConnection | null = null;
let connectionPromise: Promise<signalR.HubConnection> | null = null;

/**
 * Get the active SignalR connection if connected
 */
export const getSignalRConnection = (): signalR.HubConnection | null => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }
  return null;
};

/**
 * Start SignalR connection (singleton + race-safe)
 */
export const startSignalRConnection = async (): Promise<signalR.HubConnection> => {
  const token = getSavedToken();
  if (!token) {
    throw new Error("No auth token found");
  }

  // ✅ Already connected → reuse connection
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  // ✅ Connection is already being created → wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  // ✅ Stop old connection if exists but not connected
  if (connection) {
    await stopSignalRConnection();
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // Build hub URL
  let hubUrl: string;
  if (process.env.NEXT_PUBLIC_SIGNALR_HUB_URL) {
    hubUrl = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL;
  } else {
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    hubUrl = `${baseUrl}/hubs/chat`;
  }

  console.log("Attempting to connect to SignalR hub at:", hubUrl);

  // ✅ Assign promise immediately (prevents race condition)
  connectionPromise = new Promise<signalR.HubConnection>((resolve, reject) => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .build();

    newConnection
      .start()
      .then(() => {
        console.log("✅ SignalR Connected successfully to:", hubUrl);

        connection = newConnection;
        connectionPromise = null;

        resolve(newConnection);
      })
      .catch((err) => {
        console.error("❌ SignalR Connection Error:", err);

        connection = null;
        connectionPromise = null;

        reject(err);
      });
  });

  return connectionPromise;
};

/**
 * Stop SignalR connection safely
 */
export const stopSignalRConnection = async (): Promise<void> => {
  // Clear any pending promise
  connectionPromise = null;

  if (connection) {
    try {
      await connection.stop();
      console.log("SignalR Disconnected");
    } catch (err) {
      console.error("Error stopping SignalR connection:", err);
    } finally {
      connection = null;
    }
  }
};

/**
 * Send a message through SignalR hub
 */
export const sendMessageViaSignalR = async (
  chatId: string,
  content: string
): Promise<void> => {
  const conn = getSignalRConnection();
  if (!conn) {
    throw new Error("SignalR connection not established");
  }

  try {
    await conn.invoke("SendMessage", chatId, content);
  } catch (err) {
    console.error("Error sending message via SignalR:", err);
    throw err;
  }
};
