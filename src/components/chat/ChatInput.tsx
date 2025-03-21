import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PaperclipIcon, SendIcon, SmileIcon, MicIcon } from "lucide-react";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  allowEmoji?: boolean;
}

const ChatInput = ({
  onSendMessage = () => {},
  placeholder = "Type your message here...",
  disabled = false,
  allowAttachments = true,
  allowVoice = true,
  allowEmoji = true,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3 flex items-center gap-2">
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
        {allowAttachments && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                  disabled={disabled}
                >
                  <PaperclipIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach files</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <Input
          type="text"
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 rounded-full"
          disabled={disabled}
        />

        {allowEmoji && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                  disabled={disabled}
                >
                  <SmileIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add emoji</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {allowVoice && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                  disabled={disabled}
                >
                  <MicIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                variant="default"
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                disabled={disabled || !message.trim()}
              >
                <SendIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Send message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </form>
    </div>
  );
};

export default ChatInput;
