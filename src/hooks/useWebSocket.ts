import { useState, useEffect, useCallback } from "react";

type WebSocketMessage = {
  type: string;
  sessionId?: string;
  content?: string;
  role?: "user" | "assistant" | "system";
  id?: string;
  [key: string]: any;
};

export function useWebSocket(url?: string) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    let ws: WebSocket;
    try {
      // Use provided URL or default to current host with secure WebSocket
      const wsUrl = url || `wss://${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
      };

      setSocket(ws);

      // Clean up on unmount
      return () => {
        if (ws) {
          ws.close();
        }
      };
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      setConnected(false);
    }
  }, [url]);

  // Send message function
  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      try {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(message));
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
        return false;
      }
    },
    [socket],
  );

  return { connected, lastMessage, sendMessage };
}
