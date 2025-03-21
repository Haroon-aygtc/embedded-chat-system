import React, { useState, useEffect, useRef, useCallback } from "react";
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
  widgetId?: string;
  theme?: "light" | "dark";
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
  widgetId = "default",
  theme = "light",
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
  const [widgetSize, setWidgetSize] = useState({ width, height });
  const [deviceType, setDeviceType] = useState(getDeviceType());
  const constraintsRef = useRef(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Detect device type for responsive adjustments
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua,
      )
    ) {
      return "mobile";
    }
    return "desktop";
  }

  // Scroll to bottom of messages when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

        // Notify parent window if embedded
        if (embedded) {
          try {
            window.parent.postMessage(
              {
                type: "chat-widget-event",
                eventType: "message-received",
                data: {
                  message: assistantMessage,
                  widgetId,
                },
                timestamp: new Date().toISOString(),
              },
              window.location.origin,
            );
          } catch (e) {
            // Silently fail if parent communication fails
          }
        }
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
        payload: {
          widgetId,
          contextRuleId,
        },
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
  }, [contextMode, contextName, widgetId, contextRuleId, embedded]);

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
    setIsAssistantTyping(true);

    try {
      // Call the provided onSendMessage function if provided
      if (onSendMessage) {
        await onSendMessage(content);
      }

      // Notify parent window if embedded
      if (embedded) {
        try {
          window.parent.postMessage(
            {
              type: "chat-widget-event",
              eventType: "message-sent",
              data: {
                message: userMessage,
                widgetId,
              },
              timestamp: new Date().toISOString(),
            },
            window.location.origin,
          );
        } catch (e) {
          // Silently fail if parent communication fails
        }
      }

      // Send message via WebSocket
      const messageSent = websocketService.sendMessage({
        type: "message",
        payload: {
          id: messageId,
          content,
          contextMode,
          contextRuleId,
          widgetId,
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

          // Notify parent window if embedded
          if (embedded) {
            try {
              window.parent.postMessage(
                {
                  type: "chat-widget-event",
                  eventType: "message-received",
                  data: {
                    message: assistantMessage,
                    widgetId,
                    simulated: true,
                  },
                  timestamp: new Date().toISOString(),
                },
                window.location.origin,
              );
            } catch (e) {
              // Silently fail if parent communication fails
            }
          }
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

      // Notify parent window of error if embedded
      if (embedded) {
        try {
          window.parent.postMessage(
            {
              type: "chat-widget-event",
              eventType: "error",
              data: {
                messageId,
                error: "Failed to send message",
                widgetId,
              },
              timestamp: new Date().toISOString(),
            },
            window.location.origin,
          );
        } catch (e) {
          // Silently fail if parent communication fails
        }
      }
    }
  };

  // Handle widget open/close
  const handleToggleOpen = useCallback(() => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Notify parent window if embedded
    if (embedded) {
      try {
        window.parent.postMessage(
          {
            type: "chat-widget-event",
            eventType: newIsOpen ? "widget-opened" : "widget-closed",
            data: { widgetId },
            timestamp: new Date().toISOString(),
          },
          window.location.origin,
        );
      } catch (e) {
        // Silently fail if parent communication fails
      }
    }
  }, [isOpen, embedded, widgetId]);

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

    // Notify parent window if embedded
    if (embedded) {
      try {
        window.parent.postMessage(
          {
            type: "chat-widget-event",
            eventType: "context-changed",
            data: {
              contextMode: newMode,
              contextRuleId: newMode === "general" ? null : contextRuleId,
              contextName: newMode === "general" ? "" : contextName,
              widgetId,
            },
            timestamp: new Date().toISOString(),
          },
          window.location.origin,
        );
      } catch (e) {
        // Silently fail if parent communication fails
      }
    }
  };

  // Handle context rule change
  const handleContextRuleChange = (ruleId: string) => {
    setContextRuleId(ruleId);
    const rule = availableContextRules.find((r) => r.id === ruleId);
    if (rule) {
      setContextName(rule.name);

      // Notify parent window if embedded
      if (embedded) {
        try {
          window.parent.postMessage(
            {
              type: "chat-widget-event",
              eventType: "context-rule-changed",
              data: {
                contextRuleId: ruleId,
                contextName: rule.name,
                widgetId,
              },
              timestamp: new Date().toISOString(),
            },
            window.location.origin,
          );
        } catch (e) {
          // Silently fail if parent communication fails
        }
      }
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
          onClose={() => handleToggleOpen()}
          onMinimize={() => handleToggleOpen()}
          avatarSrc={avatarSrc}
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
        <div ref={messagesEndRef} />
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
          const { width, height, deviceType: newDeviceType } = event.data;

          if (width && height) {
            setWidgetSize({ width, height });
          }

          if (newDeviceType) {
            setDeviceType(newDeviceType);
          }
        }

        // Handle configuration updates from parent
        if (event.data && event.data.type === "chat-widget-config") {
          const config = event.data.config || {};

          // Update any configurable properties
          if (config.allowAttachments !== undefined) {
            // This won't actually update the prop, but could be used in state if needed
            // For a real implementation, you'd need to use state for these features
          }

          if (config.contextMode) {
            handleContextModeChange(config.contextMode);
          }

          if (config.contextRuleId) {
            handleContextRuleChange(config.contextRuleId);
          }

          if (config.open !== undefined) {
            setIsOpen(config.open);
          }
        }

        // Handle command to clear chat history
        if (event.data && event.data.type === "chat-widget-clear") {
          setMessages([
            {
              id: "1",
              content: `Hello! I'm your AI assistant${contextMode === "restricted" ? ` for ${contextName}` : ""}. How can I help you today?`,
              sender: "assistant",
              timestamp: new Date(),
              status: "sent",
            },
          ]);

          // Notify parent that history was cleared
          try {
            window.parent.postMessage(
              {
                type: "chat-widget-event",
                eventType: "history-cleared",
                data: { widgetId },
                timestamp: new Date().toISOString(),
              },
              window.location.origin,
            );
          } catch (e) {
            // Silently fail if parent communication fails
          }
        }
      };

      window.addEventListener("message", handleMessage);

      // Notify parent that the widget is ready
      try {
        window.parent.postMessage(
          {
            type: "chat-widget-event",
            eventType: "widget-ready",
            data: {
              widgetId,
              features: {
                attachments: allowAttachments,
                voice: allowVoice,
                emoji: allowEmoji,
              },
              contextMode,
              contextRuleId,
              contextName,
            },
            timestamp: new Date().toISOString(),
          },
          window.location.origin,
        );
      } catch (e) {
        // Silently fail if parent communication fails
      }

      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [
    embedded,
    contextMode,
    contextName,
    contextRuleId,
    widgetId,
    allowAttachments,
    allowVoice,
    allowEmoji,
    handleToggleOpen,
  ]);

  // Apply theme class to container if needed
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return () => {
      // Don't remove dark mode on unmount as it might be needed by the parent app
    };
  }, [theme]);

  // If this is a full page experience
  if (isFullPage) {
    return (
      <div
        className={`w-full h-screen bg-background ${theme === "dark" ? "dark" : ""}`}
      >
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
            initialWidth={widgetSize.width}
            initialHeight={widgetSize.height}
            onClose={() => handleToggleOpen()}
            className={cn("bg-background", theme === "dark" ? "dark" : "")}
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
              onClick={() => handleToggleOpen()}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
              style={{ backgroundColor: primaryColor }}
              aria-label="Open chat"
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
      className={`fixed inset-0 pointer-events-none overflow-hidden ${theme === "dark" ? "dark" : ""}`}
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
                width: `${widgetSize.width}px`,
                height: `${widgetSize.height}px`,
                backgroundColor: theme === "dark" ? "#1a1a1a" : "white",
                "--tw-primary": primaryColor,
                "--tw-primary-foreground": "#ffffff",
              } as React.CSSProperties
            }
            className={`${getPositionClasses()} fixed shadow-xl rounded-lg flex flex-col overflow-hidden pointer-events-auto border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
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
              onClick={() => handleToggleOpen()}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
              style={{ backgroundColor: primaryColor }}
              aria-label="Open chat"
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
