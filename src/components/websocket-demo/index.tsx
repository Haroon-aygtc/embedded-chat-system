import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import websocketService, { ConnectionState } from "@/services/websocketService";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: "user" | "server";
}

export default function WebSocketDemo() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketService.getConnectionState(),
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    // Set up event listeners
    const unsubscribeMessage = websocketService.onMessage((data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `server-${Date.now()}`,
          text: typeof data === "object" ? JSON.stringify(data) : String(data),
          timestamp: new Date().toISOString(),
          sender: "server",
        },
      ]);
    });

    const unsubscribeConnect = websocketService.onConnect(() => {
      setConnectionState(websocketService.getConnectionState());
      setQueuedCount(websocketService.getQueuedMessageCount());
    });

    const unsubscribeDisconnect = websocketService.onDisconnect(() => {
      setConnectionState(websocketService.getConnectionState());
      setQueuedCount(websocketService.getQueuedMessageCount());
    });

    const unsubscribeError = websocketService.onError(() => {
      setConnectionState(websocketService.getConnectionState());
    });

    // Check status every second
    const interval = setInterval(() => {
      setConnectionState(websocketService.getConnectionState());
      setQueuedCount(websocketService.getQueuedMessageCount());
    }, 1000);

    return () => {
      unsubscribeMessage();
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
      clearInterval(interval);
    };
  }, []);

  const handleConnect = () => {
    websocketService.connect();
  };

  const handleDisconnect = () => {
    websocketService.disconnect();
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message to the list
    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputMessage,
      timestamp: new Date().toISOString(),
      sender: "user" as const,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Send message to server
    websocketService.sendMessage({
      type: "chat",
      content: inputMessage,
    });

    // Clear input
    setInputMessage("");
  };

  const isConnected = connectionState === ConnectionState.CONNECTED;

  return (
    <Card className="w-full h-full max-w-md mx-auto bg-white shadow-lg">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="flex items-center justify-between">
          <span>WebSocket Demo</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {connectionState}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex space-x-2 mb-4">
          <Button
            onClick={handleConnect}
            disabled={
              isConnected || connectionState === ConnectionState.CONNECTING
            }
            variant="outline"
            className="w-1/2"
          >
            Connect
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={connectionState === ConnectionState.DISCONNECTED}
            variant="outline"
            className="w-1/2"
          >
            Disconnect
          </Button>
          {queuedCount > 0 && (
            <Badge variant="outline" className="ml-auto">
              {queuedCount} queued
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[300px] border rounded-md p-2 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No messages yet. Connect and send a message to start.
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-lg ${msg.sender === "user" ? "bg-primary/10 ml-4" : "bg-secondary/10 mr-4"}`}
                >
                  <div className="text-xs text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="break-words">{msg.text}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-4">
        <div className="flex w-full space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || !inputMessage.trim()}
          >
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
