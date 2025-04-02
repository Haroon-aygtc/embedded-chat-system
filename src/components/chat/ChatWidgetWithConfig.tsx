import React, { useState, useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import FollowUpQuestions from "./FollowUpQuestions";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { chatService } from "@/services/chatService";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { FollowUpConfig } from "@/components/admin/FollowUpQuestionsConfig";
import { ResponseFormattingConfig } from "@/components/admin/ResponseFormattingOptions";

interface ChatWidgetWithConfigProps {
  config?: any;
  previewMode?: boolean;
  widgetId?: string;
  onClose?: () => void;
  embedded?: boolean;
  followUpConfig?: FollowUpConfig;
  responseConfig?: ResponseFormattingConfig;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  followUpQuestions?: string[];
}

const ChatWidgetWithConfig: React.FC<ChatWidgetWithConfigProps> = ({
  config,
  previewMode = false,
  widgetId,
  onClose,
  embedded = false,
  followUpConfig,
  responseConfig,
}) => {
  const [isOpen, setIsOpen] = useState(previewMode || false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { connected, lastMessage, sendMessage } = useWebSocket();

  // Default configuration
  const defaultConfig = {
    primaryColor: "#4f46e5",
    secondaryColor: "#f3f4f6",
    fontFamily: "Inter",
    borderRadius: 8,
    position: "bottom-right",
    initialMessage: "Hello! How can I help you today?",
    placeholderText: "Type your message here...",
    titleText: "Chat Support",
    subtitleText: "We typically reply within a few minutes",
    showBranding: true,
    allowAttachments: false,
    allowFeedback: true,
  };

  // Merge provided config with defaults
  const widgetConfig = { ...defaultConfig, ...config };

  // Load widget configuration if widgetId is provided
  useEffect(() => {
    if (widgetId && !previewMode) {
      loadWidgetConfig();
    }
  }, [widgetId]);

  const loadWidgetConfig = async () => {
    try {
      // Load widget configuration from the server
      const response = await fetch(`/api/widget/${widgetId}/config`);
      if (response.ok) {
        const data = await response.json();
        // Update the widget configuration
        // This would be handled by the parent component in a real implementation
      }
    } catch (error) {
      console.error("Error loading widget configuration:", error);
    }
  };

  // Initialize chat session
  useEffect(() => {
    if (isOpen) {
      initChatSession();
    }
  }, [isOpen]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === "chat_message" && sessionId) {
      if (lastMessage.sessionId === sessionId) {
        // Add the message to the chat
        if (lastMessage.role === "assistant") {
          setIsTyping(false);

          // Generate follow-up questions if enabled
          let followUpQuestions: string[] | undefined = undefined;

          if (
            followUpConfig?.enableFollowUpQuestions &&
            followUpConfig.generateAutomatically
          ) {
            // In a real implementation, these would be generated based on the message content
            // and the configured predefined questions
            const predefinedSet = followUpConfig.predefinedQuestions[0];
            if (predefinedSet) {
              followUpQuestions = predefinedSet.questions.slice(
                0,
                followUpConfig.maxFollowUpQuestions,
              );
            }
          }

          setMessages((prev) => [
            ...prev,
            {
              id: lastMessage.id || Date.now().toString(),
              content: lastMessage.content,
              role: lastMessage.role,
              timestamp: new Date(),
              followUpQuestions,
            },
          ]);
        }
      }
    }
  }, [lastMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initChatSession = async () => {
    try {
      // Clear any existing messages
      setMessages([]);

      // In preview mode, just add the initial message
      if (previewMode) {
        // Generate follow-up questions if enabled
        let followUpQuestions: string[] | undefined = undefined;

        if (
          followUpConfig?.enableFollowUpQuestions &&
          !followUpConfig.generateAutomatically
        ) {
          // Show initial follow-up questions if configured to show at start
          const predefinedSet = followUpConfig.predefinedQuestions[0];
          if (predefinedSet) {
            followUpQuestions = predefinedSet.questions.slice(
              0,
              followUpConfig.maxFollowUpQuestions,
            );
          }
        }

        setMessages([
          {
            id: "initial",
            content: widgetConfig.initialMessage,
            role: "assistant",
            timestamp: new Date(),
            followUpQuestions,
          },
        ]);
        return;
      }

      // Create or resume a chat session
      const session = await chatService.createSession();
      setSessionId(session.id);

      // Load previous messages if any
      const history = await chatService.getSessionMessages(session.id);
      if (history.length > 0) {
        setMessages(history);
      } else {
        // Send initial message
        sendMessage({
          type: "chat_message",
          sessionId: session.id,
          content: widgetConfig.initialMessage,
          role: "assistant",
        });

        // Generate follow-up questions if enabled
        let followUpQuestions: string[] | undefined = undefined;

        if (
          followUpConfig?.enableFollowUpQuestions &&
          !followUpConfig.generateAutomatically
        ) {
          // Show initial follow-up questions if configured to show at start
          const predefinedSet = followUpConfig.predefinedQuestions[0];
          if (predefinedSet) {
            followUpQuestions = predefinedSet.questions.slice(
              0,
              followUpConfig.maxFollowUpQuestions,
            );
          }
        }

        setMessages([
          {
            id: "initial",
            content: widgetConfig.initialMessage,
            role: "assistant",
            timestamp: new Date(),
            followUpQuestions,
          },
        ]);
      }
    } catch (error) {
      console.error("Error initializing chat session:", error);
      // Even if there's an error, show the initial message in preview mode
      if (previewMode) {
        setMessages([
          {
            id: "initial",
            content: widgetConfig.initialMessage,
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize chat. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create a new message object
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
      status: "sending",
    };

    // Add the message to the UI immediately
    setMessages((prev) => [...prev, newMessage]);

    // In preview mode, simulate a response
    if (previewMode) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);

        // Generate follow-up questions if enabled
        let followUpQuestions: string[] | undefined = undefined;

        if (
          followUpConfig?.enableFollowUpQuestions &&
          followUpConfig.generateAutomatically
        ) {
          // In a real implementation, these would be generated based on the message content
          // and the configured predefined questions
          const predefinedSet = followUpConfig.predefinedQuestions[0];
          if (predefinedSet) {
            followUpQuestions = predefinedSet.questions.slice(
              0,
              followUpConfig.maxFollowUpQuestions,
            );
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content:
              "Thanks for your message! I'm here to help with any questions you might have about our products or services.",
            role: "assistant",
            timestamp: new Date(),
            followUpQuestions,
          },
        ]);
      }, 1500);
      return;
    }

    try {
      // Update message status to sent
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "sent" } : msg,
        ),
      );

      // Show typing indicator
      setIsTyping(true);

      // Send the message via WebSocket
      if (connected && sessionId) {
        sendMessage({
          type: "chat_message",
          sessionId,
          content,
          role: "user",
        });
      } else {
        // Fallback to REST API if WebSocket is not connected
        const response = await chatService.sendMessage(sessionId!, content);
        setIsTyping(false);

        // Generate follow-up questions if enabled
        let followUpQuestions: string[] | undefined = undefined;

        if (
          followUpConfig?.enableFollowUpQuestions &&
          followUpConfig.generateAutomatically
        ) {
          // In a real implementation, these would be generated based on the message content
          // and the configured predefined questions
          const predefinedSet = followUpConfig.predefinedQuestions[0];
          if (predefinedSet) {
            followUpQuestions = predefinedSet.questions.slice(
              0,
              followUpConfig.maxFollowUpQuestions,
            );
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: response.id,
            content: response.content,
            role: "assistant",
            timestamp: new Date(response.timestamp),
            followUpQuestions,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Update message status to error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "error" } : msg,
        ),
      );
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectFollowUpQuestion = (question: string) => {
    // Send the selected follow-up question as a user message
    handleSendMessage(question);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Apply custom styles based on configuration
  const widgetStyle = {
    fontFamily: widgetConfig.fontFamily,
    "--primary-color": widgetConfig.primaryColor,
    "--secondary-color": widgetConfig.secondaryColor,
    "--border-radius": `${widgetConfig.borderRadius}px`,
  } as React.CSSProperties;

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  }[widgetConfig.position];

  // If embedded, render the full widget without the toggle button
  if (embedded) {
    return (
      <div
        className="chat-widget-container h-full flex flex-col overflow-hidden rounded-lg border shadow-lg bg-white"
        style={widgetStyle}
      >
        <ChatHeader
          title={widgetConfig.titleText}
          subtitle={widgetConfig.subtitleText}
          logoUrl={widgetConfig.logoUrl}
          onClose={onClose}
          primaryColor={widgetConfig.primaryColor}
        />
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          allowFeedback={widgetConfig.allowFeedback}
          messagesEndRef={messagesEndRef}
          enableMarkdown={responseConfig?.enableMarkdown}
          followUpConfig={followUpConfig}
          onSelectFollowUpQuestion={handleSelectFollowUpQuestion}
        />
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={widgetConfig.placeholderText}
          allowAttachments={widgetConfig.allowAttachments}
          primaryColor={widgetConfig.primaryColor}
        />
        {widgetConfig.showBranding && (
          <div className="text-center py-2 text-xs text-gray-500">
            Powered by ChatAdmin
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`chat-widget fixed ${positionClasses} z-50`}
      style={widgetStyle}
    >
      {isOpen ? (
        <div className="chat-widget-expanded flex flex-col w-80 h-[500px] rounded-lg border shadow-lg bg-white overflow-hidden">
          <ChatHeader
            title={widgetConfig.titleText}
            subtitle={widgetConfig.subtitleText}
            logoUrl={widgetConfig.logoUrl}
            onClose={toggleChat}
            primaryColor={widgetConfig.primaryColor}
          />
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            allowFeedback={widgetConfig.allowFeedback}
            messagesEndRef={messagesEndRef}
            enableMarkdown={responseConfig?.enableMarkdown}
            followUpConfig={followUpConfig}
            onSelectFollowUpQuestion={handleSelectFollowUpQuestion}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder={widgetConfig.placeholderText}
            allowAttachments={widgetConfig.allowAttachments}
            primaryColor={widgetConfig.primaryColor}
          />
          {widgetConfig.showBranding && (
            <div className="text-center py-2 text-xs text-gray-500">
              Powered by ChatAdmin
            </div>
          )}
        </div>
      ) : (
        <Button
          onClick={toggleChat}
          className="chat-widget-button h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
          style={{ backgroundColor: widgetConfig.primaryColor }}
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </Button>
      )}
    </div>
  );
};

export default ChatWidgetWithConfig;
