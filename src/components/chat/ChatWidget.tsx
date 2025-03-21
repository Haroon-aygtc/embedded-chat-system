import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import DraggableResizableWidget from "./DraggableResizableWidget";
import { Message, WebSocketMessage } from "@/types/chat";
import websocketService from "@/services/websocketService";
import { contextRulesApi } from "@/services/apiService";
import { ContextRule } from "@/types/contextRules";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  title?: string;
  subtitle?: string;
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
  contextRuleId?: string;
  onSendMessage?: (message: string) => Promise<void>;
  isFullPage?: boolean;
  embedded?: boolean;
  avatarSrc?: string;
}

const ChatWidget = ({
  title = "AI Assistant",
  subtitle = "How can I help you today?",
  isOnline = true,
  position = "bottom-right",
  initiallyOpen = false,
  width = 380,
  height = 600,
  primaryColor = "#3b82f6",
  allowAttachments = true,
  allowVoice = true,
  allowEmoji = true,
  contextMode: initialContextMode = "general",
  contextName: initialContextName = "",
  contextRuleId: initialContextRuleId,
  onSendMessage = async () => {},
  isFullPage = false,
  embedded = false,
  avatarSrc,
}: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen || isFullPage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [contextMode, setContextMode] = useState<"restricted" | "general">(
    initialContextMode,
  );
  const [contextName, setContextName] = useState(initialContextName);
  const [contextRuleId, setContextRuleId] = useState(initialContextRuleId);
  const [availableContextRules, setAvailableContextRules] = useState<
    ContextRule[]
  >([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const constraintsRef = useRef(null);

  // Fetch available context rules
  useEffect(() => {
    const fetchContextRules = async () => {
      try {
        const rules = await contextRulesApi.getAll();
        setAvailableContextRules(rules.filter((rule) => rule.isActive));
      } catch (error) {
        console.error("Failed to fetch context rules:", error);
      }
    };

    fetchContextRules();
  }, []);

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
          contextRuleId,
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
        import("@/utils/logger").then((module) => {
          const logger = module.default;
          logger.warn(
            "WebSocket not connected, falling back to simulated response",
          );
        });
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
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error sending message",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
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

  // Handle context mode change
  const handleContextModeChange = (newMode: "restricted" | "general") => {
    setContextMode(newMode);
    if (newMode === "general") {
      setContextRuleId(undefined);
      setContextName("");
    } else if (
      newMode === "restricted" &&
      availableContextRules.length > 0 &&
      !contextRuleId
    ) {
      // Set default context rule if in restricted mode and none selected
      const defaultRule = availableContextRules[0];
      setContextRuleId(defaultRule.id);
      setContextName(defaultRule.name);
    }
  };

  // Handle context rule change
  const handleContextRuleChange = (ruleId: string) => {
    setContextRuleId(ruleId);
    const rule = availableContextRules.find((r) => r.id === ruleId);
    if (rule) {
      setContextName(rule.name);
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

  // Render chat content
  const renderChatContent = () => (
    <>
      <div className="flex items-center justify-between">
        <ChatHeader
          title={title}
          isOnline={isOnline}
          onClose={() => setIsOpen(false)}
          onMinimize={() => setIsOpen(false)}
        />

        <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-2">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Chat Settings</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="context-mode">Context Mode</Label>
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="context-mode"
                      className={
                        contextMode === "general"
                          ? "font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      General
                    </Label>
                    <Switch
                      id="context-mode"
                      checked={contextMode === "restricted"}
                      onCheckedChange={(checked) =>
                        handleContextModeChange(
                          checked ? "restricted" : "general",
                        )
                      }
                    />
                    <Label
                      htmlFor="context-mode"
                      className={
                        contextMode === "restricted"
                          ? "font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      Restricted
                    </Label>
                  </div>
                </div>

                {contextMode === "restricted" && (
                  <div className="space-y-2">
                    <Label htmlFor="context-rule">Context Rule</Label>
                    <select
                      id="context-rule"
                      className="w-full p-2 border rounded-md"
                      value={contextRuleId || ""}
                      onChange={(e) => handleContextRuleChange(e.target.value)}
                      disabled={availableContextRules.length === 0}
                    >
                      {availableContextRules.length === 0 ? (
                        <option value="">No rules available</option>
                      ) : (
                        availableContextRules.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

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
    </>
  );

  // Listen for messages from parent window when embedded
  useEffect(() => {
    if (embedded) {
      const handleMessage = (event: MessageEvent) => {
        // Verify the origin for security
        if (event.origin !== window.location.origin) return;

        // Handle resize events from parent
        if (event.data && event.data.type === "chat-widget-resize") {
          // Adjust layout based on new dimensions if needed
          const { width, height, deviceType } = event.data;

          // You could set these values in state if needed
          // For example, to adjust UI for very small screens
          if (width < 300 || height < 400) {
            // Apply compact mode adjustments
          }
        }
      };

      window.addEventListener("message", handleMessage);

      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [embedded]);

  // If this is a full page experience
  if (isFullPage) {
    return (
      <div className="w-full h-screen bg-background">
        <div className="container mx-auto h-full flex flex-col p-4">
          {renderChatContent()}
        </div>
      </div>
    );
  }

  // If this is embedded and should be draggable/resizable
  if (embedded) {
    return (
      <AnimatePresence>
        {isOpen ? (
          <DraggableResizableWidget
            initialWidth={width}
            initialHeight={height}
            onClose={() => setIsOpen(false)}
            className={cn("bg-background")}
          >
            {renderChatContent()}
          </DraggableResizableWidget>
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
    );
  }

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
            {renderChatContent()}
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
