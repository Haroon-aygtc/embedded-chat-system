import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Wifi,
  WifiOff,
  RefreshCw,
  Info,
  AlertCircle,
} from "lucide-react";

interface Message {
  id: string;
  type: string;
  payload?: any;
  timestamp: string;
  clientId?: string;
}

const WebSocketClientDemo = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [clientId] = useState(
    `client_${Math.random().toString(36).substring(2, 9)}`,
  );
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [activeTab, setActiveTab] = useState("chat");
  const [latency, setLatency] = useState<number | null>(null);
  const [isCheckingLatency, setIsCheckingLatency] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to WebSocket server
  const connectWebSocket = () => {
    try {
      // Use localhost for development
      const wsUrl = `ws://localhost:8080`;
      const newSocket = new WebSocket(wsUrl);

      setConnectionAttempts((prev) => prev + 1);
      setSocket(newSocket);

      newSocket.onopen = () => {
        setConnected(true);
        addSystemMessage("Connected to WebSocket server");
      };

      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);

        // Handle ping response for latency calculation
        if (data.type === "pong" && data.sentAt) {
          const latencyMs = Date.now() - parseInt(data.sentAt);
          setLatency(latencyMs);
          setIsCheckingLatency(false);
        }
      };

      newSocket.onclose = () => {
        setConnected(false);
        addSystemMessage("Disconnected from WebSocket server");
      };

      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnected(false);
        addSystemMessage("Error connecting to WebSocket server", "error");
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      addSystemMessage("Failed to connect to WebSocket server", "error");
    }
  };

  // Add system message to the messages list
  const addSystemMessage = (
    message: string,
    type: "info" | "error" = "info",
  ) => {
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      type: "system",
      payload: { message, alertType: type },
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMessage]);
  };

  // Send message to WebSocket server
  const sendMessage = () => {
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !inputMessage.trim()
    ) {
      return;
    }

    const message = {
      type: "chat",
      payload: { text: inputMessage },
      clientId: clientId,
    };

    socket.send(JSON.stringify(message));
    setInputMessage("");
  };

  // Check connection latency
  const checkLatency = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    setIsCheckingLatency(true);
    const pingMessage = {
      type: "ping",
      sentAt: Date.now().toString(),
    };

    socket.send(JSON.stringify(pingMessage));
  };

  // Disconnect from WebSocket server
  const disconnect = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Clean up WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>WebSocket Demo</CardTitle>
          <Badge
            variant={connected ? "success" : "destructive"}
            className="ml-2"
          >
            {connected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" /> Connected
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" /> Disconnected
              </>
            )}
          </Badge>
        </div>
        <CardDescription>
          Demonstrates real-time communication with WebSocket server
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="status">Connection Status</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <CardContent>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  if (msg.type === "system") {
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-2 p-2 rounded-md ${msg.payload?.alertType === "error" ? "bg-destructive/10 text-destructive" : "bg-muted"}`}
                      >
                        {msg.payload?.alertType === "error" ? (
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                        ) : (
                          <Info className="h-4 w-4 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm">{msg.payload?.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === "chat") {
                    const isCurrentUser = msg.clientId === clientId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        >
                          <p>{msg.payload?.text}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <div className="flex w-full space-x-2">
              <Input
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={!connected}
              />
              <Button onClick={sendMessage} disabled={!connected}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between w-full">
              {!connected ? (
                <Button onClick={connectWebSocket} variant="outline" size="sm">
                  Connect
                </Button>
              ) : (
                <Button onClick={disconnect} variant="outline" size="sm">
                  Disconnect
                </Button>
              )}

              <Button
                onClick={checkLatency}
                variant="ghost"
                size="sm"
                disabled={!connected || isCheckingLatency}
              >
                {isCheckingLatency ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                Ping {latency !== null ? `(${latency}ms)` : ""}
              </Button>
            </div>
          </CardFooter>
        </TabsContent>

        <TabsContent value="status">
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Status:</div>
                <div>
                  <Badge variant={connected ? "success" : "destructive"}>
                    {connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                <div className="text-sm font-medium">Client ID:</div>
                <div className="text-sm font-mono">{clientId}</div>

                <div className="text-sm font-medium">Connection Attempts:</div>
                <div className="text-sm">{connectionAttempts}</div>

                <div className="text-sm font-medium">Latency:</div>
                <div className="text-sm">
                  {latency !== null ? `${latency}ms` : "Not measured"}
                </div>

                <div className="text-sm font-medium">Messages Received:</div>
                <div className="text-sm">{messages.length}</div>

                <div className="text-sm font-medium">WebSocket URL:</div>
                <div className="text-sm font-mono truncate">
                  ws://localhost:8080
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={checkLatency}
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  disabled={!connected || isCheckingLatency}
                >
                  {isCheckingLatency ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : null}
                  Check Latency
                </Button>

                {!connected ? (
                  <Button onClick={connectWebSocket} size="sm">
                    Connect
                  </Button>
                ) : (
                  <Button onClick={disconnect} variant="destructive" size="sm">
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default WebSocketClientDemo;
