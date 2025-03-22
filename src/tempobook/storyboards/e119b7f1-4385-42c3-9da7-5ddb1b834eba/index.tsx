import React from "react";
import WebSocketStatus from "@/components/websocket-demo/WebSocketStatus";

export default function WebSocketStatusDemo() {
  return (
    <div className="p-4 bg-gray-100 min-h-screen flex items-center justify-center">
      <WebSocketStatus />
    </div>
  );
}
