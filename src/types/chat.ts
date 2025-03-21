export type MessageStatus = "sending" | "sent" | "error";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  status?: MessageStatus;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WebSocketMessage {
  type: "message" | "typing" | "read" | "error" | "connection" | "history";
  payload: any;
  timestamp: string;
}
