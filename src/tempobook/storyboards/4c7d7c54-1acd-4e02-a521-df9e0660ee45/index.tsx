import React, { useEffect, useState } from "react";
import websocketService, { ConnectionState } from "@/services/websocketService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WebSocketServiceDemo() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketService.getConnectionState(),
  );
  const [messages, setMessages] = useState<string[]>([]);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Set up event listeners
    const unsubscribeConnect = websocketService.onConnect(() => {
      setConnectionState(websocketService.getConnectionState());
      addMessage("Connected to WebSocket server");
      setQueuedCount(websocketService.getQueuedMessageCount());
    });

    const unsubscribeMessage = websocketService.onMessage((message) => {
      addMessage(`Received: ${JSON.stringify(message)}`);
      setQueuedCount(websocketService.getQueuedMessageCount());
    });

    const unsubscribeError = websocketService.onError(() => {
      setConnectionState(websocketService.getConnectionState());
      addMessage("WebSocket error occurred");
    });

    const unsubscribeDisconnect = websocketService.onDisconnect(() => {
      setConnectionState(websocketService.getConnectionState());
      addMessage("Disconnected from WebSocket server");
    });

    // Check connection state periodically
    const intervalId = setInterval(() => {
      setConnectionState(websocketService.getConnectionState());
      setQueuedCount(websocketService.getQueuedMessageCount());
    }, 1000);

    return () => {
      unsubscribeConnect();
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeDisconnect();
      clearInterval(intervalId);
      websocketService.disconnect();
    };
  }, []);

  const addMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleConnect = () => {
    addMessage("Attempting to connect...");
    websocketService.connect();
  };

  const handleDisconnect = () => {
    addMessage("Disconnecting...");
    websocketService.disconnect();
  };

  const handleSendMessage = () => {
    const message = {
      type: "message",
      content: "Hello from WebSocket demo!",
      timestamp: Date.now(),
    };
    const sent = websocketService.sendMessage(message);
    addMessage(
      `Sent message: ${JSON.stringify(message)} (${sent ? "delivered" : "queued"})`,
    );
    setQueuedCount(websocketService.getQueuedMessageCount());
  };

  const getConnectionColor = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return "bg-green-500";
      case ConnectionState.CONNECTING:
        return "bg-yellow-500";
      case ConnectionState.RECONNECTING:
        return "bg-orange-500";
      case ConnectionState.DISCONNECTED:
        return "bg-gray-500";
      case ConnectionState.FAILED:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="p-4 flex flex-col h-full bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${getConnectionColor()}`}
          ></div>
          <span className="font-medium">Status: {connectionState}</span>
        </div>
        <span className="text-sm text-gray-500">
          {queuedCount} queued messages
        </span>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button
          onClick={handleConnect}
          disabled={
            connectionState === ConnectionState.CONNECTED ||
            connectionState === ConnectionState.CONNECTING
          }
          className="flex-1"
        >
          Connect
        </Button>
        <Button
          onClick={handleDisconnect}
          disabled={
            connectionState === ConnectionState.DISCONNECTED ||
            connectionState === ConnectionState.FAILED
          }
          variant="outline"
          className="flex-1"
        >
          Disconnect
        </Button>
        <Button onClick={handleSendMessage} className="flex-1">
          Send Message
        </Button>
      </div>

      <div className="flex-1 overflow-auto border rounded p-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="text-sm mb-1 font-mono whitespace-pre-wrap break-all"
          >
            {msg}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-gray-400 text-center mt-4">No messages yet</div>
        )}
      </div>
    </Card>
  );
}
