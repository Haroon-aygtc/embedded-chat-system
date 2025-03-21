import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, WebSocketMessage } from "@/types/chat";
import websocketService from "@/services/websocketService";

interface ChatWidgetProps {
  title?: string;
  isOnline?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initiallyOpen?: boolean;
  width?: number;
  height?: number;
  primaryColor?: string;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  allowEmoji?: boolean;
  contextMode?: "restricted" | "general";
  contextName?: string;
  onSendMessage?: (message: string) => Promise<void>;
}

const ChatWidget = ({
  title = "AI Assistant",
  isOnline = true,
  position = "bottom-right",
  initiallyOpen = false,
  width = 380,
  height = 600,
  primaryColor = "#3b82f6",
  allowAttachments = true,
  allowVoice = true,
  allowEmoji = true,
  contextMode = "general",
  contextName = "",
  onSendMessage = async () => {},
}: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const constraintsRef = useRef(null);

  // Initialize WebSocket connection and welcome message
  useEffect(() => {
    // Connect to WebSocket
    if (!websocketService.isConnected()) {
      websocketService.connect();
    }

    // Set up message handler
    const unsubscribe = websocketService.onMessage((data: WebSocketMessage) => {
      if (data.type === "message" && data.payload) {
        const assistantMessage: Message = {
          id: data.payload.id || Date.now().toString(),
          content: data.payload.content,
          sender: "assistant",
          timestamp: new Date(data.timestamp),
          status: "sent",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsAssistantTyping(false);
      } else if (data.type === "typing") {
        setIsAssistantTyping(data.payload.isTyping);
      } else if (data.type === "history" && Array.isArray(data.payload)) {
        // Handle message history
        const historyMessages = data.payload.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          status: "sent",
        }));
        setMessages(historyMessages as Message[]);
      }
    });

    // Set up connection handler
    const connectionHandler = websocketService.onConnect(() => {
      // Request chat history when connected
      websocketService.sendMessage({
        type: "history_request",
        payload: {},
        timestamp: new Date().toISOString(),
      });
    });

    // Initialize with welcome message if no history is loaded
    const initialMessages: Message[] = [
      {
        id: "1",
        content: `Hello! I'm your AI assistant${contextMode === "restricted" ? ` for ${contextName}` : ""}. How can I help you today?`,
        sender: "assistant",
        timestamp: new Date(),
        status: "sent",
      },
    ];
    setMessages(initialMessages);

    // Clean up on unmount
    return () => {
      unsubscribe();
      connectionHandler();
    };
  }, [contextMode, contextName]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create a new user message
    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      content,
      sender: "user",
      timestamp: new Date(),
      status: "sending",
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);

    // Show loading state
    setIsLoading(true);

    try {
      // Call the provided onSendMessage function if provided
      if (onSendMessage) {
        await onSendMessage(content);
      }

      // Send message via WebSocket
      const messageSent = websocketService.sendMessage({
        type: "message",
        payload: {
          id: messageId,
          content,
          contextMode,
          contextName,
        },
        timestamp: new Date().toISOString(),
      });

      // Update message status based on whether it was sent successfully
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: messageSent ? "sent" : "error" }
            : msg,
        ),
      );

      // If WebSocket is not connected, fall back to simulated response
      if (!messageSent) {
        console.warn(
          "WebSocket not connected, falling back to simulated response",
        );
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: getSimulatedResponse(content, contextMode, contextName),
            sender: "assistant",
            timestamp: new Date(),
            status: "sent",
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
          setIsAssistantTyping(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      setIsAssistantTyping(false);

      // Update the user message to show error status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "error" } : msg,
        ),
      );
    }
  };

  // Position classes based on the position prop
  const getPositionClasses = () => {
    switch (position) {
      case "bottom-left":
        return "left-4 bottom-4";
      case "top-right":
        return "right-4 top-4";
      case "top-left":
        return "left-4 top-4";
      case "bottom-right":
      default:
        return "right-4 bottom-4";
    }
  };

  return (
    <div
      ref={constraintsRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={
              {
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: "white",
                "--tw-primary": primaryColor,
                "--tw-primary-foreground": "#ffffff",
              } as React.CSSProperties
            }
            className={`${getPositionClasses()} fixed shadow-xl rounded-lg flex flex-col overflow-hidden pointer-events-auto border border-gray-200`}
          >
            <ChatHeader
              title={title}
              isOnline={isOnline}
              onClose={() => setIsOpen(false)}
              onMinimize={() => setIsOpen(false)}
            />

            <div className="flex-1 flex flex-col">
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                className="flex-1"
              />
              <TypingIndicator isTyping={isAssistantTyping} className="ml-12" />
            </div>

            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
              allowAttachments={allowAttachments}
              allowVoice={allowVoice}
              allowEmoji={allowEmoji}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`${getPositionClasses()} fixed pointer-events-auto`}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageCircle size={24} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to generate simulated responses based on context
const getSimulatedResponse = (
  message: string,
  contextMode: string,
  contextName: string,
): string => {
  // Simple response simulation based on context mode
  if (contextMode === "restricted" && contextName) {
    if (contextName === "UAE Government Information") {
      return `Based on UAE government information, I can help answer your question about "${message}". This is a simulated response for demonstration purposes. In a real implementation, this would be processed by Gemini or Hugging Face AI models with proper context filtering.`;
    } else {
      return `As your assistant for ${contextName}, I'm here to help with "${message}". This is a simulated response for demonstration purposes. In a real implementation, this would be processed by Gemini or Hugging Face AI models with proper context filtering.`;
    }
  } else {
    return `I understand you're asking about "${message}". This is a simulated response for demonstration purposes. In a real implementation, this would be processed by Gemini or Hugging Face AI models.`;
  }
};

export default ChatWidget;
