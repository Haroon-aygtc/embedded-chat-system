import React, { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { Message } from "@/types/chat";

type ChatMessagesProps = {
  messages?: Message[];
  isLoading?: boolean;
  className?: string;
};

const ChatMessages = ({
  messages = defaultMessages,
  isLoading = false,
  className,
}: ChatMessagesProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages, isLoading]);
  return (
    <div className={cn("flex-1 bg-white", className)}>
      <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
        <div className="flex flex-col space-y-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          {isLoading && <LoadingMessage />}
        </div>
      </ScrollArea>
    </div>
  );
};

type MessageItemProps = {
  message: Message;
};

const MessageItem = ({ message }: MessageItemProps) => {
  const isUser = message.sender === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-3 max-w-[85%]",
        isUser ? "ml-auto" : "mr-auto",
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </Avatar>
      )}
      <div
        className={cn(
          "rounded-lg p-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div className="mt-1 text-xs opacity-70 text-right">
          {formatMessageTime(message.timestamp)}
          {message.status === "sending" && " • Sending..."}
          {message.status === "error" && " • Failed to send"}
        </div>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </Avatar>
      )}
    </div>
  );
};

const LoadingMessage = () => {
  return (
    <div className="flex items-start gap-3 max-w-[85%] mr-auto">
      <Avatar className="h-8 w-8 bg-primary/10">
        <Bot className="h-4 w-4 text-primary" />
      </Avatar>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[170px]" />
      </div>
    </div>
  );
};

// Helper function to format message timestamp
const formatMessageTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

// Default messages for demonstration
const defaultMessages: Message[] = [
  {
    id: "1",
    content: "Hello! How can I help you today?",
    sender: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: "2",
    content:
      "I have a question about embedding this chat widget on my website. How do I get started?",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
  },
  {
    id: "3",
    content:
      "Great question! You can embed this chat widget using either an iframe or as a Web Component using Shadow DOM. Would you like me to explain both options?",
    sender: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
  },
  {
    id: "4",
    content:
      "Yes, please explain both options and which one would be better for my WordPress site.",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
  },
  {
    id: "5",
    content:
      'For WordPress, I recommend using the iframe option as it\'s simpler to implement. Just add this code snippet to your theme or use a custom HTML block:\n\n<iframe src="https://your-chat-domain.com/widget" width="380" height="600" frameborder="0"></iframe>\n\nThe Web Component option gives you more customization but requires JavaScript knowledge. Would you like me to provide that code as well?',
    sender: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60), // 1 minute ago
  },
];

export default ChatMessages;
