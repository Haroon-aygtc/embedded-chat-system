import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import websocketService from "@/services/websocketService";
import { ConnectionState } from "@/types/websocket";

const WebSocketStatus = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketService.getConnectionState(),
  );
  const [stats, setStats] = useState(websocketService.getStats());
  const [lastPingLatency, setLastPingLatency] = useState<number | null>(null);

  useEffect(() => {
    // Update connection state when it changes
    const unsubscribeConnect = websocketService.onConnect(() => {
      setConnectionState(websocketService.getConnectionState());
      setStats(websocketService.getStats());
    });

    const unsubscribeDisconnect = websocketService.onDisconnect(() => {
      setConnectionState(websocketService.getConnectionState());
      setStats(websocketService.getStats());
    });

    // Listen for pong messages to measure latency
    const unsubscribeMessage = websocketService.onMessage((data) => {
      if (data.type === "pong") {
        const latency = Date.now() - data.sentAt;
        setLastPingLatency(latency);
      }
    });

    // Update stats periodically
    const interval = setInterval(() => {
      setConnectionState(websocketService.getConnectionState());
      setStats(websocketService.getStats());
    }, 1000);

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeMessage();
      clearInterval(interval);
    };
  }, []);

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

  // Send a test message
  const sendTestMessage = () => {
    websocketService.sendMessage({
      type: "test",
      payload: { text: "Test message", sentAt: Date.now() },
      timestamp: new Date().toISOString(),
    });
  };

  // Manually ping to test latency
  const sendPing = () => {
    websocketService.sendMessage({
      type: "ping",
      sentAt: Date.now(),
      timestamp: new Date().toISOString(),
    });
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
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Connection:</div>
          <div className="font-medium">
            {websocketService.isConnected() ? "Connected" : "Disconnected"}
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

        {stats.reconnectAttempts > 0 && (
          <Progress
            value={(stats.reconnectAttempts / stats.maxReconnectAttempts) * 100}
            className="h-2"
          />
        )}

        <div className="flex space-x-2 pt-2">
          <Button
            size="sm"
            onClick={() => websocketService.connect()}
            disabled={websocketService.isConnected()}
          >
            Connect
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => websocketService.disconnect()}
            disabled={!websocketService.isConnected()}
          >
            Disconnect
          </Button>
          <Button size="sm" variant="secondary" onClick={sendPing}>
            Ping
          </Button>
          <Button size="sm" variant="secondary" onClick={sendTestMessage}>
            Test Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebSocketStatus;
