import React, { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  allowFeedback?: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  allowFeedback = true,
  messagesEndRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    console.log(
      `Feedback for message ${messageId}: ${isPositive ? "👍" : "👎"}`,
    );
    // In a real implementation, this would send the feedback to the server
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={containerRef}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <Avatar className="h-8 w-8 mt-1">
              {message.role === "user" ? (
                <>
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                  <AvatarFallback>U</AvatarFallback>
                </>
              ) : (
                <>
                  <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=assistant" />
                  <AvatarFallback>AI</AvatarFallback>
                </>
              )}
            </Avatar>

            <div
              className={`mx-2 ${message.role === "user" ? "items-end" : "items-start"} flex flex-col`}
            >
              <div
                className={`rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"} ${message.status === "error" ? "border border-red-500" : ""}`}
                style={{
                  backgroundColor:
                    message.role === "user"
                      ? "var(--primary-color, #4f46e5)"
                      : "var(--secondary-color, #f3f4f6)",
                  color:
                    message.role === "user"
                      ? "white"
                      : "var(--text-color, #374151)",
                  borderRadius: "var(--border-radius, 8px)",
                }}
              >
                {message.content}
              </div>

              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span>{formatTime(message.timestamp)}</span>
                {message.status === "sending" && (
                  <span className="ml-2 italic">Sending...</span>
                )}
                {message.status === "error" && (
                  <span className="ml-2 text-red-500">Failed to send</span>
                )}
              </div>

              {allowFeedback && message.role === "assistant" && (
                <div className="flex mt-1 space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleFeedback(message.id, true)}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleFeedback(message.id, false)}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="flex max-w-[80%]">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=assistant" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>

            <div className="mx-2 items-start flex flex-col">
              <div
                className="rounded-lg p-3 bg-secondary text-secondary-foreground"
                style={{
                  backgroundColor: "var(--secondary-color, #f3f4f6)",
                  color: "var(--text-color, #374151)",
                  borderRadius: "var(--border-radius, 8px)",
                }}
              >
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* This div is used to scroll to the bottom */}
      <div ref={messagesEndRef} />

      {/* Show empty state if no messages */}
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
          <p>Starting conversation...</p>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
