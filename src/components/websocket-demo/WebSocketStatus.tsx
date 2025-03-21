import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Send, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import websocketService from "@/services/websocketService";
import { ConnectionState } from "@/types/websocket";

const WebSocketStatus = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [channel, setChannel] = useState("chat");
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketService.getConnectionState
      ? websocketService.getConnectionState()
      : ConnectionState.DISCONNECTED,
  );
  const [stats, setStats] = useState(
    websocketService.getStats
      ? websocketService.getStats()
      : {
          queuedMessages: 0,
          reconnectAttempts: 0,
          maxReconnectAttempts: 5,
          messageRatePerMinute: 0,
        },
  );
  const [lastPingLatency, setLastPingLatency] = useState<number | null>(null);

  useEffect(() => {
    // Setup WebSocket event listeners
    const handleOpen = () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
      setMessages((prev) => [...prev, "Connected to WebSocket server"]);
      if (websocketService.getConnectionState) {
        setConnectionState(websocketService.getConnectionState());
      }
      if (websocketService.getStats) {
        setStats(websocketService.getStats());
      }
    };

    const handleClose = () => {
      setConnected(false);
      setConnecting(false);
      setMessages((prev) => [...prev, "Disconnected from WebSocket server"]);
      if (websocketService.getConnectionState) {
        setConnectionState(websocketService.getConnectionState());
      }
      if (websocketService.getStats) {
        setStats(websocketService.getStats());
      }
    };

    const handleError = (err: any) => {
      setConnected(false);
      setConnecting(false);
      setError("Failed to connect to WebSocket server");
      console.error("WebSocket error:", err);
    };

    const handleMessage = (message: any) => {
      try {
        const data =
          typeof message === "string" ? JSON.parse(message) : message;
        if (data.type === "pong" && data.sentAt) {
          const latency = Date.now() - data.sentAt;
          setLastPingLatency(latency);
        }

        if (data.channel === channel || !data.channel) {
          setMessages((prev) => [...prev, `Received: ${JSON.stringify(data)}`]);
        }
      } catch (err) {
        setMessages((prev) => [...prev, `Received: ${message}`]);
      }
    };

    // Register event listeners
    if (websocketService.onOpen) websocketService.onOpen(handleOpen);
    if (websocketService.onClose) websocketService.onClose(handleClose);
    if (websocketService.onError) websocketService.onError(handleError);
    if (websocketService.onMessage) websocketService.onMessage(handleMessage);

    // Update stats periodically if methods exist
    const interval = setInterval(() => {
      if (websocketService.getConnectionState) {
        setConnectionState(websocketService.getConnectionState());
      }
      if (websocketService.getStats) {
        setStats(websocketService.getStats());
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (websocketService.offOpen) websocketService.offOpen(handleOpen);
      if (websocketService.offClose) websocketService.offClose(handleClose);
      if (websocketService.offError) websocketService.offError(handleError);
      if (websocketService.offMessage)
        websocketService.offMessage(handleMessage);
      clearInterval(interval);

      // Disconnect if connected
      if (connected && websocketService.disconnect) {
        websocketService.disconnect();
      }
    };
  }, [connected, channel]);

  // Get appropriate color for connection state
  const getStateColor = (state: ConnectionState) => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return "bg-green-500";
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return "bg-yellow-500";
      case ConnectionState.DISCONNECTED:
      case ConnectionState.FAILED:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleConnect = () => {
    setConnecting(true);
    setError(null);
    if (websocketService.connect) {
      websocketService.connect();
    }
  };

  const handleDisconnect = () => {
    if (websocketService.disconnect) {
      websocketService.disconnect();
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    try {
      if (websocketService.send || websocketService.sendMessage) {
        const messageObj = {
          channel,
          message: inputMessage,
          type: "message",
          timestamp: new Date().toISOString(),
        };

        if (websocketService.send) {
          websocketService.send(messageObj);
        } else if (websocketService.sendMessage) {
          websocketService.sendMessage(messageObj);
        }

        setMessages((prev) => [...prev, `Sent to ${channel}: ${inputMessage}`]);
        setInputMessage("");
      }
    } catch (err) {
      setError("Failed to send message");
      console.error("Error sending message:", err);
    }
  };

  const sendPing = () => {
    if (websocketService.sendMessage) {
      websocketService.sendMessage({
        type: "ping",
        sentAt: Date.now(),
        timestamp: new Date().toISOString(),
      });
    }
  };

  const isConnected = () => {
    return websocketService.isConnected
      ? websocketService.isConnected()
      : connected;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>WebSocket Status</span>
          <Badge
            className={`${getStateColor(connectionState)} text-white`}
            variant="outline"
          >
            {connectionState}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Connection:</div>
          <div className="font-medium">
            {isConnected() ? "Connected" : "Disconnected"}
          </div>

          <div>Queue Size:</div>
          <div className="font-medium">{stats.queuedMessages} messages</div>

          <div>Reconnect Attempts:</div>
          <div className="font-medium">
            {stats.reconnectAttempts}/{stats.maxReconnectAttempts}
          </div>

          <div>Message Rate:</div>
          <div className="font-medium">{stats.messageRatePerMinute}/min</div>

          {lastPingLatency !== null && (
            <>
              <div>Last Ping Latency:</div>
              <div className="font-medium">{lastPingLatency}ms</div>
            </>
          )}
        </div>

        <div className="flex space-x-2 pt-2">
          {!isConnected() ? (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="channel">Channel</Label>
          <Input
            id="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="Enter channel name"
            disabled={!isConnected()}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="messages">Messages</Label>
          <div
            className="h-40 p-2 border rounded-md overflow-y-auto bg-gray-50 text-sm"
            id="messages"
          >
            {messages.length === 0 ? (
              <div className="text-gray-400 italic text-center mt-12">
                No messages yet
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="mb-1">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <div className="flex space-x-2">
            <Input
              id="message"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message"
              disabled={!isConnected()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected() || !inputMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={sendPing}
            disabled={!isConnected()}
          >
            Ping
          </Button>
        </div>

        {isConnected() && (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>WebSocket connection is active</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WebSocketStatus;
