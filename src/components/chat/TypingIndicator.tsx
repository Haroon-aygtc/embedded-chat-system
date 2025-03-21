import React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isTyping: boolean;
  className?: string;
}

const TypingIndicator = ({ isTyping, className }: TypingIndicatorProps) => {
  if (!isTyping) return null;

  return (
    <div className={cn("flex items-center space-x-1 p-2", className)}>
      <div className="text-xs text-muted-foreground">Assistant is typing</div>
      <div className="flex space-x-1">
        <div
          className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
};

export default TypingIndicator;
