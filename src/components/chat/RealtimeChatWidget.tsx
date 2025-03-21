import React, { useState, useEffect, useRef } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, Minimize2, Maximize2, Send, MessageSquare } from "lucide-react";
import chatService, { ChatMessage } from "@/services/chatService";
import { useChatMessages } from "@/hooks/useRealtime";
import TypingIndicator from "./TypingIndicator";
import { v4 as uuidv4 } from "uuid";

interface RealtimeChatWidgetProps {
  userId?: string;
  contextRuleId?: string;
  initialSessionId?: string;
  title?: string;
  minimized?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
}

export default function RealtimeChatWidget({
  userId = `anonymous-${uuidv4()}`,
  contextRuleId,
  initialSessionId,
  title = "Chat Support",
  minimized = false,
  onClose,
  onMinimize,
  onMaximize,
  className = "",
}: RealtimeChatWidgetProps) {
  const [sessionId, setSessionId] = useState<string>(initialSessionId || "");
  const [inputMessage, setInputMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(minimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the real-time hook to get messages
  const { messages: realtimeMessages, error } = useChatMessages(
    sessionId,
    !!sessionId,
  );

  // Combine local and real-time messages
  const allMessages = [...localMessages, ...realtimeMessages];

  // Create a session if we don't have one
  useEffect(() => {
    const initializeSession = async () => {
      if (!sessionId) {
        try {
          const session = await chatService.createSession(
            userId,
            contextRuleId,
          );
          if (session) {
            setSessionId(session.sessionId);

            // Send a welcome message
            const welcomeMessage = await chatService.sendMessage(
              session.sessionId,
              "system",
              "Welcome to our chat support! How can I help you today?",
              "system",
            );

            if (welcomeMessage) {
              setLocalMessages([welcomeMessage]);
            }
          }
        } catch (error) {
          console.error("Failed to create chat session", error);
        }
      }
    };

    initializeSession();
  }, [sessionId, userId, contextRuleId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Error in real-time messages subscription:", error);
    }
  }, [error]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    // Optimistically add message to local state
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      userId,
      message: inputMessage,
      messageType: "user",
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, tempMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Send message to server
      await chatService.sendMessage(sessionId, userId, inputMessage, "user");

      // Simulate AI response after a delay
      setTimeout(async () => {
        const aiResponse = await chatService.sendMessage(
          sessionId,
          "ai",
          `Thank you for your message! This is a simulated AI response to: "${inputMessage}". In a production environment, this would be processed by your AI service.`,
          "ai",
        );
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to send message", error);
      setIsTyping(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized && onMaximize) {
      onMaximize();
    } else if (!isMinimized && onMinimize) {
      onMinimize();
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (isMinimized) {
    return (
      <Button
        onClick={toggleMinimize}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-lg"
        variant="default"
      >
        <MessageSquare size={24} />
      </Button>
    );
  }

  return (
    <Card className={`w-full max-w-md bg-white shadow-lg ${className}`}>
      <CardHeader className="bg-primary text-primary-foreground p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                    onClick={toggleMinimize}
                  >
                    <Minimize2 size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Minimize</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                    onClick={handleClose}
                  >
                    <X size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Close</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        <ScrollArea className="h-[300px] pr-4">
          {allMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              Starting a new conversation...
            </div>
          ) : (
            <div className="space-y-3">
              {allMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${msg.messageType === "user" ? "bg-primary/10 ml-8" : msg.messageType === "system" ? "bg-muted" : "bg-secondary/10 mr-8"}`}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {msg.messageType === "user"
                      ? "You"
                      : msg.messageType === "system"
                        ? "System"
                        : "Assistant"}
                    {" • "}
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="break-words">{msg.message}</div>
                </div>
              ))}
              {isTyping && (
                <div className="p-3 rounded-lg bg-secondary/10 mr-8">
                  <div className="text-xs text-muted-foreground mb-1">
                    Assistant
                  </div>
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-3">
        <div className="flex w-full space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !sessionId}
            size="icon"
          >
            <Send size={18} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
